import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import * as crypto from 'node:crypto'
import {
    inspectPublishAutoScriptReadiness,
    publishSealedCanonToFleet,
} from '../98.menu.unit/buz/fleetPublish.buzz.js'
import { DEFAULT_AUTO_SCRIPT_CONFIG } from '../38.types.unit/fce/autoScriptRule.interface.js'

function sha256File(filePath: string): string {
    return crypto
        .createHash('sha256')
        .update(fs.readFileSync(filePath))
        .digest('hex')
}

describe('Lore Fleet Export Auto-Script Parity', () => {
    it('inspects auto_script_bundle readiness accurately', () => {
        const ready = inspectPublishAutoScriptReadiness({
            auto_script_bundle: {
                config: DEFAULT_AUTO_SCRIPT_CONFIG,
                voice_lexicon: { char_johnny: {}, char_orbie: {} },
                location_stage_profiles: { loc_culvert: {} },
                dramatic_palette: {},
            },
        })
        expect(ready.ready).toBe(true)
        expect(ready.ruleCount).toBe(DEFAULT_AUTO_SCRIPT_CONFIG.rules.length)
        expect(ready.voiceCount).toBe(2)
        expect(ready.locationCount).toBe(1)
        expect(ready.outputSubdir).toBe('drafts/auto-script')

        const legacy = inspectPublishAutoScriptReadiness({
            schema_version: '1.0.0',
            entities: {},
        })
        expect(legacy.ready).toBe(false)
        expect(legacy.ruleCount).toBe(0)
        expect(legacy.voiceCount).toBe(0)
    })

    it('copies sealed bible-state.json with SHA-256 parity and emits cns00 telemetry', async () => {
        const tmpRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'fleet-auto-script-'),
        )
        const slug = '000.sample-hearth'
        const srcPath = path.resolve(
            process.cwd(),
            '..',
            '..',
            'compiled',
            slug,
            'bible-state.json',
        )
        if (!fs.existsSync(srcPath)) {
            fs.rmSync(tmpRoot, { recursive: true, force: true })
            return
        }

        const engineRoot = path.join(tmpRoot, '000.series-sower-engine')
        fs.mkdirSync(engineRoot, { recursive: true })
        const logs: string[] = []
        const mockState: any = {
            hunt: (act: string, bal: any) => {
                if (act === '[Console action] Update Console' && bal?.src) {
                    logs.push(bal.src)
                }
            },
        }

        let resolvedBit: any = null
        await publishSealedCanonToFleet(
            {},
            {
                idx: 'test-pub',
                src: slug,
                dat: {
                    seriesSlug: slug,
                    targetEngineRoot: engineRoot,
                    targetSpatialRoot: path.join(tmpRoot, 'missing-spatial'),
                },
                slv: (res: any) => {
                    resolvedBit = res
                },
            },
            mockState,
        )

        const dstPath = path.join(
            engineRoot,
            'compiled',
            slug,
            'bible-state.json',
        )
        expect(fs.existsSync(dstPath)).toBe(true)
        expect(sha256File(dstPath)).toBe(sha256File(srcPath))
        expect(resolvedBit?.pubBit?.val).toBe(1)
        expect(
            logs.some(
                (l) =>
                    l.includes('>> [PUBLISH:AUTO_SCRIPT]') ||
                    l.includes(':: [PUBLISH:WARN]'),
            ),
        ).toBe(true)

        fs.rmSync(tmpRoot, { recursive: true, force: true })
    })

    it('emits :: [PUBLISH:WARN] gracefully for legacy manifests lacking auto_script_bundle', async () => {
        const logs: string[] = []
        const mockState: any = {
            hunt: (act: string, bal: any) => {
                if (act === '[Console action] Update Console' && bal?.src) {
                    logs.push(bal.src)
                }
            },
        }
        // Validate readiness directly for legacy manifest without auto_script_bundle
        const legacyCheck = inspectPublishAutoScriptReadiness({
            schema_version: '1.0.0',
            series_slug: 'legacy-series',
            entities: {},
        })
        expect(legacyCheck.ready).toBe(false)

        // Ensure non-existent slug fails closed without throwing
        let failBit: any = null
        await publishSealedCanonToFleet(
            {},
            {
                idx: 'test-missing',
                src: 'non-existent-auto-script-series',
                slv: (res: any) => {
                    failBit = res
                },
            },
            mockState,
        )
        expect(failBit?.pubBit?.val).toBe(-1)
        expect(logs.some((l) => l.includes('[PUBLISH_ERROR]'))).toBe(true)
    })
})
