import { describe, it, expect } from 'vitest'
import { getCharacterSomaticMask } from '../buz/somaticMask.buzz.js'

describe('Deep-Frozen Somatic Mask Roll-Up Projection', () => {
    const mockRegistry = new Map<string, any>([
        [
            'char_wart',
            {
                machineRail: {
                    id: 'char_wart',
                    name: 'Wart',
                    type: 'character',
                    somatic: {
                        locomotion_baseline: 'bipedal_hunched',
                        banned_kinetic_verbs: ['climb', 'embrace'],
                        conditions: ['severed_left_arm'],
                        motor_limitations: ['UNSTEADY_GAIT', 'NO_HEAVY_LIFT'],
                        sensory: {
                            optical_state: 'MONOCULAR',
                            blind_cone_degrees: 60,
                            auditory_floor_debuff_cdb: 1500,
                        },
                        vocal_dsp: {
                            pitch_shift_centitones: -100,
                            speed_multiplier_bps: 9500,
                            pause_frequency_bps: 12000,
                        },
                    },
                },
            },
        ],
        [
            'char_spleen',
            {
                machineRail: {
                    id: 'char_spleen',
                    name: 'Spleen',
                    type: 'character',
                    somatic: {
                        locomotion_baseline: 'limping',
                        banned_kinetic_verbs: [],
                        conditions: [],
                        motor_limitations: [],
                    },
                },
            },
        ],
        [
            'char_amputee_extreme',
            {
                machineRail: {
                    id: 'char_amputee_extreme',
                    name: 'Extreme Amputee',
                    type: 'character',
                    somatic: {
                        locomotion_baseline: 'bipedal_standard',
                        conditions: [
                            'severed_left_arm',
                            'severed_right_arm',
                            'braxial_plexus_severed',
                        ],
                    },
                },
            },
        ],
        [
            'char_slug',
            {
                machineRail: {
                    id: 'char_slug',
                    name: 'Slug',
                    type: 'character',
                    somatic: {
                        locomotion_baseline: 'sessile',
                        conditions: [],
                    },
                },
            },
        ],
        [
            'char_mute',
            {
                machineRail: {
                    id: 'char_mute',
                    name: 'Mute Goblin',
                    type: 'character',
                    somatic: {
                        locomotion_baseline: 'bipedal_standard',
                        motor_limitations: ['MUTE'],
                    },
                },
            },
        ],
    ])

    it('calculates single amputation as 10000 bps (1.0 arm) and inherits bimanual bans', () => {
        const mask = getCharacterSomaticMask('char_wart', mockRegistry)

        expect(mask.characterId).toBe('char_wart')
        expect(mask.locomotionBaseline).toBe('bipedal_hunched')
        expect(mask.availableArmsBps).toBe(10000) // 1.0 arm
        expect(mask.bannedKineticVerbs).toContain('bimanual_lift')
        expect(mask.bannedKineticVerbs).toContain('dual_wield')
        expect(mask.bannedKineticVerbs).toContain('two_handed_strike')
        expect(mask.bannedKineticVerbs).toContain('climb')
        expect(mask.bannedKineticVerbs).toContain('embrace')
        expect(mask.sensoryAcuity.opticalState).toBe('MONOCULAR')
        expect(mask.sensoryAcuity.blindConeDegrees).toBe(60)
        expect(mask.canSpeak).toBe(true)
    })

    it('inherits limping gait restrictions automatically', () => {
        const mask = getCharacterSomaticMask('char_spleen', mockRegistry)

        expect(mask.locomotionBaseline).toBe('limping')
        expect(mask.availableArmsBps).toBe(20000) // 2.0 arms
        expect(mask.bannedKineticVerbs).toContain('sprint')
        expect(mask.bannedKineticVerbs).toContain('vault')
        expect(mask.bannedKineticVerbs).toContain('leap')
        expect(mask.bannedKineticVerbs).not.toContain('bimanual_lift')
    })

    it('clamps compound amputations to zero without negative limb counts', () => {
        const mask = getCharacterSomaticMask(
            'char_amputee_extreme',
            mockRegistry,
        )

        expect(mask.availableArmsBps).toBe(0) // max(0, 20000 - 30000) = 0
        expect(mask.bannedKineticVerbs).toContain('grasp')
        expect(mask.bannedKineticVerbs).toContain('hold')
        expect(mask.bannedKineticVerbs).toContain('pick_lock')
    })

    it('sets available arms to 0 bps for sessile locomotion baseline', () => {
        const mask = getCharacterSomaticMask('char_slug', mockRegistry)

        expect(mask.availableArmsBps).toBe(0)
        expect(mask.bannedKineticVerbs).toContain('walk')
        expect(mask.bannedKineticVerbs).toContain('run')
        expect(mask.bannedKineticVerbs).toContain('climb')
    })

    it('correctly sets canSpeak to false for actors with MUTE motor limitation', () => {
        const mask = getCharacterSomaticMask('char_mute', mockRegistry)
        expect(mask.canSpeak).toBe(false)
    })

    it('ensures banned kinetic verbs are alphabetically sorted and deduplicated', () => {
        const mask = getCharacterSomaticMask('char_wart', mockRegistry)
        const sorted = [...mask.bannedKineticVerbs].sort()
        expect(mask.bannedKineticVerbs).toEqual(sorted)

        const uniqueSet = new Set(mask.bannedKineticVerbs)
        expect(uniqueSet.size).toBe(mask.bannedKineticVerbs.length)
    })

    it('negative control: fails closed with explicit error on unknown character ID', () => {
        expect(() =>
            getCharacterSomaticMask('char_ghost', mockRegistry),
        ).toThrow(/\[LORE CLIENT\] Unknown character ID: 'char_ghost'/)
    })

    it('negative control: enforces deepFreeze runtime immutability against mutation attempts', () => {
        const mask = getCharacterSomaticMask('char_wart', mockRegistry)

        expect(() => {
            // @ts-expect-error - Runtime Mutation Trap
            mask.availableArmsBps = 20000
        }).toThrow(TypeError)

        expect(() => {
            ;(mask.bannedKineticVerbs as string[]).push('dance')
        }).toThrow(TypeError)

        expect(() => {
            ;(mask.sensoryAcuity as any).opticalState = 'BLIND'
        }).toThrow(TypeError)
    })
})
