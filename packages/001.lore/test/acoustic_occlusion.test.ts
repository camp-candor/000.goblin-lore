import { describe, it, expect } from 'vitest'
import { AcousticWavefrontSolver } from '../src/health/acousticOcclusion.js'
import {
    hasLineOfSight,
    axialToDoubledCartesian,
    integerCrossProduct,
    getAxialDistance,
} from '../src/core/cartesian/lineOfSight.js'

describe('Acoustic Attenuation & Line-of-Sight Ray-Caster', () => {
    describe('Acoustic Wavefront Centi-Decibel Engine', () => {
        it('enforces additive attenuation across multiple portals with ambient cutoff', () => {
            const solver = new AcousticWavefrontSolver([
                {
                    roomId: 'loc_cellar',
                    ambientNoiseFloorCdB: 1000, // 10 dB
                    adjacentPortals: [
                        {
                            targetRoomId: 'loc_pantry',
                            portalId: 'portal_pantry_hatch',
                            dampingCdB: 3000, // 30 dB
                            isClosed: false,
                        },
                    ],
                },
                {
                    roomId: 'loc_pantry',
                    ambientNoiseFloorCdB: 1500, // 15 dB
                    adjacentPortals: [
                        {
                            targetRoomId: 'loc_courtyard',
                            portalId: 'portal_iron_door',
                            dampingCdB: 4500, // 45 dB
                            isClosed: false,
                        },
                    ],
                },
                {
                    roomId: 'loc_courtyard',
                    ambientNoiseFloorCdB: 2500, // 25 dB ambient noise
                    adjacentPortals: [],
                },
            ])

            // Sound 8,000 cdB (80 dB) from cellar
            const emission = {
                eventId: 'event_crowbar_strike',
                originRoomId: 'loc_cellar',
                sourcePowerCdB: 8000,
                tick: 1,
            }

            const wavefront = solver.propagateWavefront(emission)

            // Cellar power: 8,000 cdB
            expect(wavefront.get('loc_cellar')?.arrivalIntensityCdB).toBe(8000)

            // Pantry power: 8,000 - 3,000 = 5,000 cdB (50 dB) > 1,500 ambient -> Audible
            expect(wavefront.get('loc_pantry')?.arrivalIntensityCdB).toBe(5000)

            // Courtyard power: 5,000 - 4,500 = 500 cdB (5 dB) <= 2,500 ambient -> Cutoff swallowed
            expect(wavefront.has('loc_courtyard')).toBe(false)

            // Verify observer in courtyard gets ACOUSTIC_CUTOFF
            const observer = {
                actorId: 'char_spleen',
                roomId: 'loc_courtyard',
                hearingThresholdCdB: 2000,
            }

            const receipt = solver.evaluateObserverAudibility(
                emission,
                observer,
                wavefront,
            )
            expect(receipt.isAudible).toBe(false)
            expect(receipt.witnessCategory).toBe('ACOUSTIC_CUTOFF')
        })

        it('differentiates direct witness from muffled eavesdropping via SNR margin', () => {
            const solver = new AcousticWavefrontSolver([
                {
                    roomId: 'loc_vault',
                    ambientNoiseFloorCdB: 1000,
                    adjacentPortals: [
                        {
                            targetRoomId: 'loc_alcove',
                            portalId: 'portal_wood_seam',
                            dampingCdB: 1200, // 12 dB thin wood seam
                            isClosed: false,
                        },
                    ],
                },
                {
                    roomId: 'loc_alcove',
                    ambientNoiseFloorCdB: 1000,
                    adjacentPortals: [],
                },
            ])

            const loudShout = {
                eventId: 'event_shout',
                originRoomId: 'loc_vault',
                sourcePowerCdB: 6000, // 60 dB
                tick: 1,
            }

            const wavefront = solver.propagateWavefront(loudShout)
            // Arrival in alcove: 6,000 - 1,200 = 4,800 cdB (48 dB) >= 3,500 -> DIRECT_AUDITORY_WITNESS
            const directObserver = {
                actorId: 'char_wart',
                roomId: 'loc_alcove',
                hearingThresholdCdB: 2000,
            }
            const directReceipt = solver.evaluateObserverAudibility(
                loudShout,
                directObserver,
                wavefront,
            )
            expect(directReceipt.witnessCategory).toBe(
                'DIRECT_AUDITORY_WITNESS',
            )
            expect(directReceipt.isAudible).toBe(true)

            const whisper = {
                eventId: 'event_whisper',
                originRoomId: 'loc_vault',
                sourcePowerCdB: 4000, // 40 dB whisper
                tick: 2,
            }

            const whisperWavefront = solver.propagateWavefront(whisper)
            // Arrival: 4,000 - 1,200 = 2,800 cdB (28 dB). > 2,000 threshold and SNR = 1,800 >= 600
            // But < 3,500 -> MUFFLED_EAVESDROPPING
            const eavesdropReceipt = solver.evaluateObserverAudibility(
                whisper,
                directObserver,
                whisperWavefront,
            )
            expect(eavesdropReceipt.witnessCategory).toBe(
                'MUFFLED_EAVESDROPPING',
            )
            expect(eavesdropReceipt.isAudible).toBe(true)
        })
    })

    describe('Doubled Integer Lattice Line-of-Sight & EDGE_PAIR Policy', () => {
        it('guarantees optical reciprocity (LoS(A, B) === LoS(B, A)) across diagonal obstacles', () => {
            const cellMap = new Map()
            // Solid wall at (1, 1)
            cellMap.set('1,1', {
                coord: { q: 1, r: 1 },
                opacityPermille: 1000,
                illuminationLux: 300,
            })
            cellMap.set('0,0', {
                coord: { q: 0, r: 0 },
                opacityPermille: 0,
                illuminationLux: 300,
            })
            cellMap.set('2,2', {
                coord: { q: 2, r: 2 },
                opacityPermille: 0,
                illuminationLux: 300,
            })

            const origin = { q: 0, r: 0 }
            const target = { q: 2, r: 2 }

            const forward = hasLineOfSight(origin, target, cellMap)
            const reverse = hasLineOfSight(target, origin, cellMap)

            expect(forward.clear).toBe(false)
            expect(reverse.clear).toBe(false)
            expect(forward.clarityTier).toBe('OCCLUDED_BLIND')
            expect(reverse.clarityTier).toBe('OCCLUDED_BLIND')
        })

        it('enforces Endpoint Exemption allowing origin and target in partial opacity', () => {
            const cellMap = new Map()
            // Origin and target have nonzero opacity (e.g., character standing in light steam)
            cellMap.set('0,0', {
                coord: { q: 0, r: 0 },
                opacityPermille: 500,
                illuminationLux: 300,
            })
            cellMap.set('0,1', {
                coord: { q: 0, r: 1 },
                opacityPermille: 0,
                illuminationLux: 300,
            })

            const trace = hasLineOfSight(
                { q: 0, r: 0 },
                { q: 0, r: 1 },
                cellMap,
            )
            expect(trace.clear).toBe(true)
            expect(trace.visualClarityScore).toBeGreaterThanOrEqual(700)
            expect(trace.clarityTier).toBe('FULLY_RESOLVED')
        })

        it('severs line-of-sight when crossing closed portal edges', () => {
            const cellMap = new Map()
            const closedEdges = new Set(['0,0<->0,1'])

            const trace = hasLineOfSight(
                { q: 0, r: 0 },
                { q: 0, r: 1 },
                cellMap,
                closedEdges,
            )
            expect(trace.clear).toBe(false)
            expect(trace.blockReason).toContain('EDGE_PAIR_CLOSED_PORTAL')
            expect(trace.clarityTier).toBe('OCCLUDED_BLIND')
        })
    })
})
