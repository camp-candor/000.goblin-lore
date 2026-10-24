/**
 * packages/299.lore/01.location.unit/test/locationScaffold.test.ts
 * Vitest verification battery for Interactive Location Scaffolding Interview.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { LocationModel } from '../location.model.js'
import * as ActLoc from '../location.action.js'
import { reducer } from '../location.reduce.js'
import {
    renderLocationDossierMarkdown,
    writeLocationDossierAtomic,
    reconcileReciprocalLocationLinks,
    ACOUSTIC_PRESETS,
    NOISE_FLOOR_PRESETS,
} from '../buz/locationScaffold.buzz.js'

describe('Interactive Location Scaffolding Interview (01.location.unit)', () => {
    const tmpTestDir = path.join(process.cwd(), '.tmp_test_location_scaffold')

    afterEach(() => {
        if (fs.existsSync(tmpTestDir)) {
            fs.rmSync(tmpTestDir, { recursive: true, force: true })
        }
    })

    it('P0.1: formats location dossier starting strictly with --- at Byte 0', () => {
        const md = renderLocationDossierMarkdown({
            id: 'loc_test_chamber',
            name: 'Test Chamber',
            maxAdultGoblins: 2,
            acousticDampingCdB: ACOUSTIC_PRESETS.THIN_LATH_PARTITION.dampingCdB,
            ambientNoiseCdB: NOISE_FLOOR_PRESETS.STEAM_SEEPAGE.noiseCdB,
            volumeProfile: 'CRAMPED_CHOKE',
            connectedLocations: ['loc_origin_hub'],
        })

        const buf = Buffer.from(md, 'utf8')
        expect(buf[0]).toBe(0x2d) // '-'
        expect(buf[1]).toBe(0x2d) // '-'
        expect(buf[2]).toBe(0x2d) // '-'
        expect(buf[3]).toBe(0x0a) // '\n'
        expect(md.includes('id: loc_test_chamber')).toBe(true)
        expect(md.includes('max_adult_goblins: 2')).toBe(true)
        expect(md.includes('acoustic_damping_cdb: 1200')).toBe(true)
        expect(md.includes('## Tactical Geometry & Hex Grid')).toBe(true)
        expect(md.includes('## Sensory Atmosphere & Lighting')).toBe(true)
    })

    it('P0.2: writes file atomically and preserves Byte 0 invariant', () => {
        const targetFile = path.join(tmpTestDir, 'loc_atomic_test.md')
        const content = renderLocationDossierMarkdown({
            id: 'loc_atomic_test',
            name: 'Atomic Test Room',
            maxAdultGoblins: 1,
            acousticDampingCdB: 2500,
            ambientNoiseCdB: 20,
            volumeProfile: 'VERTICAL_SHAFT',
            connectedLocations: [],
        })

        writeLocationDossierAtomic(targetFile, content)

        expect(fs.existsSync(targetFile)).toBe(true)
        const readBuf = fs.readFileSync(targetFile)
        expect(readBuf[0]).toBe(0x2d)
        expect(readBuf[1]).toBe(0x2d)
        expect(readBuf[2]).toBe(0x2d)
    })

    it('P0.3: reconciles reciprocal topological edges across adjacent location files', () => {
        fs.mkdirSync(tmpTestDir, { recursive: true })
        const targetA = path.join(tmpTestDir, 'loc_room_a.md')

        // Create room A
        const mdA = renderLocationDossierMarkdown({
            id: 'loc_room_a',
            name: 'Room A',
            maxAdultGoblins: 2,
            acousticDampingCdB: 1500,
            ambientNoiseCdB: 40,
            volumeProfile: 'MODERATE_CHAMBER',
            connectedLocations: [],
        })
        writeLocationDossierAtomic(targetA, mdA)

        // Reconcile new room B linking to room A
        const reconciled = reconcileReciprocalLocationLinks(
            tmpTestDir,
            'loc_room_b',
            ['loc_room_a'],
        )
        expect(reconciled).toEqual(['loc_room_a'])

        // Assert room A now lists room B
        const updatedA = fs.readFileSync(targetA, 'utf8')
        expect(updatedA.includes('- loc_room_b')).toBe(true)
        expect(updatedA.startsWith('---\n')).toBe(true)
    })

    it('P0.4: routes SCAFFOLD_LOCATION_WIZARD through reducer with state bus mocks', async () => {
        const model = new LocationModel()
        const calls: Array<{ action: string; payload: any }> = []

        const mockState: any = {
            hunt: vi.fn(async (action: string, payload: any) => {
                calls.push({ action, payload })
                return {}
            }),
        }

        let resolvedResult: any = null
        const action = new ActLoc.ScaffoldLocationWizard({
            idx: 'test-loc-wizard',
            dat: {
                seriesSlug: 'test-series',
                locId: 'loc_unit_test',
                name: 'Unit Test Chamber',
                maxAdultGoblins: 4,
                volumeProfile: 'EXPOSED_BASIN',
                acousticDampingCdB: 4500,
                ambientNoiseCdB: 60,
                connectedLocations: [],
                reconcileReciprocalLinks: false,
            },
            slv: (res) => {
                resolvedResult = res
            },
        })

        await reducer(model, action, mockState)

        expect(resolvedResult).toBeDefined()
        expect(resolvedResult.success).toBe(true)
        expect(resolvedResult.locId).toBe('loc_unit_test')

        const consoleCalls = calls.filter(
            (c) => c.action === '[Console action] Update Console',
        )
        expect(consoleCalls.length).toBeGreaterThan(0)
        const sealedCall = consoleCalls.find((c) =>
            c.payload?.src?.includes('written to disk at Byte 0'),
        )
        expect(sealedCall).toBeDefined()

        // Clean up created file in series/test-series if written
        if (resolvedResult.filePath && fs.existsSync(resolvedResult.filePath)) {
            fs.unlinkSync(resolvedResult.filePath)
            const parentDir = path.dirname(resolvedResult.filePath)
            if (fs.existsSync(parentDir)) fs.rmdirSync(parentDir)
        }
    })
})
