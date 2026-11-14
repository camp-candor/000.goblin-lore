import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { CONFIGURE_PACING_BUDGET } from '../98.menu.unit/menu.action.js'
import {
    AUTO_SCRIPT_SUBMENU_CHOICES,
    PACING_SUBMENU_CHOICES,
    applyPacingBudgetPatch,
    renderAsciiPacingCurvePreview,
} from '../98.menu.unit/buz/autoScriptMenu.buzz.js'
import { verifyByteZeroBuffer } from '../27.seed.unit/buz/seedWorldDefinitions.buzz.js'

function makeSeriesDir(): string {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pacing-menu-'))
    fs.writeFileSync(
        path.join(tmp, 'series.config.json'),
        JSON.stringify(
            { series_slug: path.basename(tmp), auto_script: {} },
            null,
            2,
        ),
    )
    return tmp
}

describe('pacing-budget-menu', () => {
    it('registers action and submenu choices', () => {
        expect(CONFIGURE_PACING_BUDGET).toBe(
            '[Menu action] Configure Pacing Budget',
        )
        expect(AUTO_SCRIPT_SUBMENU_CHOICES).toContain(
            '[5] CONFIGURE THREE-ACT PACING BUDGET',
        )
        expect(PACING_SUBMENU_CHOICES).toContain(
            '[1] SET MIN TICKS BETWEEN SCENES',
        )
        expect(PACING_SUBMENU_CHOICES).toContain(
            '[5] PREVIEW 24H ASCII PACING CURVE',
        )
        expect(PACING_SUBMENU_CHOICES).toContain('[<] BACK TO CATALYST MENU')
    })

    it('persists valid patch and refreshes Byte-0 dossier', () => {
        const dir = makeSeriesDir()
        const pacing = applyPacingBudgetPatch(dir, {
            min_ticks_between_scenes: 4,
        })
        expect(pacing.min_ticks_between_scenes).toBe(4)
        const cfg = JSON.parse(
            fs.readFileSync(path.join(dir, 'series.config.json'), 'utf8'),
        )
        expect(cfg.auto_script.pacing_budget.min_ticks_between_scenes).toBe(4)
        const buf = fs.readFileSync(
            path.join(dir, 'world', 'dramatic-catalysts.md'),
        )
        expect(verifyByteZeroBuffer(buf)).toBe(true)
        fs.rmSync(dir, { recursive: true, force: true })
    })

    it('rejects invalid patch fail-closed before disk mutation', () => {
        const dir = makeSeriesDir()
        expect(() =>
            applyPacingBudgetPatch(dir, {
                act_i_end_bps: 8000,
                act_ii_end_bps: 3000,
            }),
        ).toThrow()
        expect(() =>
            applyPacingBudgetPatch(dir, {
                min_ticks_between_scenes: -1,
            } as any),
        ).toThrow()
        const cfg = JSON.parse(
            fs.readFileSync(path.join(dir, 'series.config.json'), 'utf8'),
        )
        expect(cfg.auto_script?.pacing_budget).toBeUndefined()
        fs.rmSync(dir, { recursive: true, force: true })
    })

    it('renders ASCII 24h curve with act stages', () => {
        const seen: string[] = []
        const ste: any = {
            hunt: (_a: string, p: any) => {
                seen.push(String(p?.src || ''))
            },
        }
        const lines = renderAsciiPacingCurvePreview({}, ste)
        const text = lines.join('\n')
        expect(text).toContain('ACT_I')
        expect(text).toContain('ACT_II')
        expect(text).toContain('ACT_III')
        expect(text).toContain('#')
        for (const line of lines) {
            for (let i = 0; i < line.length; i++) {
                expect(line.charCodeAt(i) <= 0x7f).toBe(true)
            }
        }
        expect(seen.length).toBeGreaterThan(0)
    })
})
