import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
    AUTO_SCRIPT_MENU_LABEL,
    applyAutoScriptConfigPatch,
    previewCharacterVoiceSample,
    runAutoScriptMenu,
} from '../98.menu.unit/buz/autoScriptMenu.buzz.js'
import {
    OPEN_AUTO_SCRIPT_MENU,
    OpenAutoScriptMenu,
} from '../98.menu.unit/menu.action.js'
import { reducer as menuReducer } from '../98.menu.unit/menu.reduce.js'
import { MenuModel } from '../98.menu.unit/menu.model.js'
import { verifyByteZeroBuffer } from '../27.seed.unit/buz/seedWorldDefinitions.buzz.js'

function isAscii(s: string): boolean {
    for (let i = 0; i < s.length; i++) {
        if (s.charCodeAt(i) > 0x7f) return false
    }
    return true
}

describe('Lore Auto-Script Catalyst Authoring Menu', () => {
    it('exports canonical menu label and action constant', () => {
        expect(AUTO_SCRIPT_MENU_LABEL).toBe(
            '[A] CONFIGURE AUTO-SCRIPT CATALYSTS',
        )
        expect(OPEN_AUTO_SCRIPT_MENU).toBe(
            '[Menu action] Open Auto-Script Menu',
        )
    })

    it('persists valid threshold and output_subdir and refreshes Byte-0 dramatic-catalysts.md', () => {
        const tmpDir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'auto-script-menu-'),
        )
        const configPath = path.join(tmpDir, 'series.config.json')
        fs.writeFileSync(
            configPath,
            JSON.stringify({ series_slug: 'test-series' }, null, 2) + '\n',
            'utf8',
        )

        const updated = applyAutoScriptConfigPatch(tmpDir, {
            min_global_significance_bps: 6500,
            output_subdir: 'drafts/custom-scripts',
        })
        expect(updated.min_global_significance_bps).toBe(6500)
        expect(updated.output_subdir).toBe('drafts/custom-scripts')

        const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        expect(savedConfig.auto_script.min_global_significance_bps).toBe(6500)

        const dossierPath = path.join(tmpDir, 'world', 'dramatic-catalysts.md')
        const buf = fs.readFileSync(dossierPath)
        expect(verifyByteZeroBuffer(buf)).toBe(true)
        expect(buf.includes('\r')).toBe(false)

        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('rejects out-of-bounds thresholds and unsafe paths fail-closed before mutating disk', () => {
        const tmpDir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'auto-script-fail-'),
        )
        const configPath = path.join(tmpDir, 'series.config.json')
        const originalText =
            JSON.stringify(
                {
                    series_slug: 'fail-closed-series',
                    auto_script: { min_global_significance_bps: 5000 },
                },
                null,
                2,
            ) + '\n'
        fs.writeFileSync(configPath, originalText, 'utf8')

        expect(() =>
            applyAutoScriptConfigPatch(tmpDir, {
                min_global_significance_bps: 10001,
            }),
        ).toThrow()
        expect(() =>
            applyAutoScriptConfigPatch(tmpDir, {
                min_global_significance_bps: -5,
            }),
        ).toThrow()
        expect(() =>
            applyAutoScriptConfigPatch(tmpDir, {
                output_subdir: '../bad',
            }),
        ).toThrow()

        expect(fs.readFileSync(configPath, 'utf8')).toBe(originalText)
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('previews character voice samples across all 6 Fountain categories in pure ASCII', () => {
        const sample = previewCharacterVoiceSample({
            id: 'char_johnny',
            name: 'Johnny Walkman',
            voice_notes: 'Short declarative sentences.',
            few_shot_lines: ['Valve is stuck. Hand me the iron bar.'],
        })
        expect(sample.cue).toBe('JOHNNY')
        const cats = Object.keys(sample.samplesByCategory)
        expect(cats.length).toBe(6)
        for (const c of cats) {
            const entry = (sample.samplesByCategory as any)[c]
            expect(isAscii(entry.sceneHeading)).toBe(true)
            expect(isAscii(entry.actionLine)).toBe(true)
            expect(isAscii(entry.characterCue)).toBe(true)
            expect(isAscii(entry.parenthetical)).toBe(true)
            expect(isAscii(entry.dialogue)).toBe(true)
            expect(isAscii(entry.transition)).toBe(true)
        }
    })

    it('dispatches OPEN_AUTO_SCRIPT_MENU programmatically and emits cns00 telemetry', async () => {
        const tmpDir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'auto-script-dispatch-'),
        )
        fs.writeFileSync(
            path.join(tmpDir, 'series.config.json'),
            JSON.stringify({ series_slug: 'dispatch-series' }, null, 2) + '\n',
            'utf8',
        )
        const logs: string[] = []
        const mockState: any = {
            hunt: (act: string, bal: any) => {
                if (act === '[Console action] Update Console' && bal?.src) {
                    logs.push(bal.src)
                }
            },
        }
        let resolved: any = null
        await menuReducer(
            new MenuModel(),
            new OpenAutoScriptMenu({
                idx: 'test-auto-script',
                dat: {
                    seriesDir: tmpDir,
                    patch: { min_global_significance_bps: 7200 },
                },
                slv: (res: any) => {
                    resolved = res
                },
            }),
            mockState,
        )

        expect(resolved?.mnuBit?.val).toBe(1)
        expect(
            resolved?.mnuBit?.dat?.autoScript?.min_global_significance_bps,
        ).toBe(7200)
        expect(logs.some((l) => l.includes('>> [AUTO_SCRIPT:CONFIG]'))).toBe(
            true,
        )

        // Verify interactive Blessed net binding
        const calls: Array<{ act: string; net: any }> = []
        const prevLib = (globalThis as any).LIBRARY
        ;(globalThis as any).LIBRARY = {
            hunt: async (act: string, bal: any) => {
                if (act === '[Grid action] Update Grid') {
                    return { grdBit: { dat: { mesh: 'left-4-col' } } }
                }
                if (
                    act === '[Open action] Open Choice' ||
                    act === '[Open action] Open Input'
                ) {
                    calls.push({ act, net: bal?.net })
                    return { chcBit: { src: '[<] RETURN TO LORE MENU' } }
                }
                return {}
            },
        }
        try {
            await runAutoScriptMenu(new MenuModel(), {
                idx: 'test-interactive',
                dat: { seriesDir: tmpDir },
            })
            expect(calls.length).toBeGreaterThan(0)
            expect(calls[0].net).toEqual({ mesh: 'left-4-col' })
        } finally {
            ;(globalThis as any).LIBRARY = prevLib
        }

        fs.rmSync(tmpDir, { recursive: true, force: true })
    })
})
