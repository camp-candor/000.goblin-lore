import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import { resolveRepoRoot } from '../../29.series.unit/buz/scaffoldSeriesTree.buzz.js'
import {
    AutoScriptConfigSchema,
    DEFAULT_AUTO_SCRIPT_CONFIG,
    PacingBudgetConfigSchema,
    resolvePacingBudgetConfig,
    type AutoScriptConfig,
    type PacingBudgetConfig,
    type SignificantEventCategory,
} from '../../38.types.unit/fce/autoScriptRule.interface.js'
import {
    buildDramaticCatalystsDossier,
    verifyByteZeroBuffer,
} from '../../27.seed.unit/buz/seedWorldDefinitions.buzz.js'
import { buildCharacterVoiceProfile } from '../../02.character.unit/buz/character.buzz.js'
import { buildEventDramaticPalette } from '../../11.events.unit/buz/events.buzz.js'

export const AUTO_SCRIPT_MENU_LABEL = '[A] CONFIGURE AUTO-SCRIPT CATALYSTS'

export const AUTO_SCRIPT_SUBMENU_CHOICES: readonly string[] = Object.freeze([
    '[1] INSPECT CATALYST RULES',
    '[2] SET GLOBAL SIGNIFICANCE THRESHOLD (BPS)',
    '[3] TOGGLE EVENT CATEGORY TRIGGER',
    '[4] PREVIEW CHARACTER VOICE SAMPLE',
    '[5] CONFIGURE THREE-ACT PACING BUDGET',
    '[<] RETURN TO LORE MENU',
])

export const AUTO_SCRIPT_MENU_CHOICES = AUTO_SCRIPT_SUBMENU_CHOICES

export const PACING_SUBMENU_CHOICES: readonly string[] = Object.freeze([
    '[1] SET MIN TICKS BETWEEN SCENES',
    '[2] SET MAX DRY SPELL TICKS',
    '[3] SET ACT I II III MULTIPLIERS (BPS)',
    '[4] TOGGLE ACT WINDOW MODE (HORIZON / 24H)',
    '[5] PREVIEW 24H ASCII PACING CURVE',
    '[<] BACK TO CATALYST MENU',
])

const ALL_CATEGORIES: SignificantEventCategory[] = [
    'PARANOIA_TRIGGERED',
    'GRIEVANCE_BREACH',
    'SOMATIC_TRAUMA',
    'INVENTORY_TRANSFER',
    'EPISTEMIC_REVEAL',
    'CHRONO_MILESTONE',
]

function sanitizeAsciiLine(raw: string): string {
    return String(raw || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
}

function emitConsole(ste: State | undefined, line: string): void {
    const clean = sanitizeAsciiLine(line)
    const lib = (globalThis as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        try {
            lib.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: clean,
            })
        } catch {
            // ignore console emission error
        }
        return
    }
    if (ste && typeof ste.hunt === 'function') {
        try {
            ste.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: clean,
            })
        } catch {
            // ignore console emission error
        }
    }
}

export function applyAutoScriptConfigPatch(
    seriesDir: string,
    patch: Record<string, any>,
): AutoScriptConfig {
    if (
        patch &&
        typeof patch.output_subdir === 'string' &&
        (patch.output_subdir.includes('..') ||
            path.isAbsolute(patch.output_subdir) ||
            patch.output_subdir.includes('\\'))
    ) {
        throw new Error(
            `[UNSAFE_PATH] output_subdir cannot contain path traversal or absolute paths: ${patch.output_subdir}`,
        )
    }

    const configPath = path.join(seriesDir, 'series.config.json')
    const existing = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
        : {}

    const baseAutoScript =
        existing?.auto_script && typeof existing.auto_script === 'object'
            ? existing.auto_script
            : {}

    const merged = {
        ...baseAutoScript,
        ...(patch ?? {}),
    }

    // Fail-closed validation BEFORE mutating disk
    const resolved = AutoScriptConfigSchema.parse(merged)

    existing.auto_script = resolved
    if (!existing.series_slug) {
        existing.series_slug = path.basename(seriesDir)
    }

    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2) + '\n', {
        encoding: 'utf8',
    })

    const slug = String(existing.series_slug || path.basename(seriesDir))
    const worldDir = path.join(seriesDir, 'world')
    if (!fs.existsSync(worldDir)) {
        fs.mkdirSync(worldDir, { recursive: true })
    }
    const dossier = buildDramaticCatalystsDossier(resolved, slug)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '')
    const dossierPath = path.join(worldDir, 'dramatic-catalysts.md')
    fs.writeFileSync(dossierPath, dossier, { encoding: 'utf8' })
    const buf = fs.readFileSync(dossierPath)
    if (!verifyByteZeroBuffer(buf)) {
        throw new Error(
            `[BYTE_ZERO_BREACH] dramatic-catalysts.md failed Byte-0 verification at ${dossierPath}`,
        )
    }

    return resolved
}

export function applyPacingBudgetPatch(
    seriesDir: string,
    patch: Record<string, any>,
): PacingBudgetConfig {
    const configPath = path.join(seriesDir, 'series.config.json')
    const existing = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
        : {}
    const baseAutoScript =
        existing?.auto_script && typeof existing.auto_script === 'object'
            ? existing.auto_script
            : {}
    const basePacing =
        baseAutoScript?.pacing_budget &&
        typeof baseAutoScript.pacing_budget === 'object'
            ? baseAutoScript.pacing_budget
            : {}
    const mergedPacing = { ...basePacing, ...(patch ?? {}) }
    const resolvedPacing = PacingBudgetConfigSchema.parse(mergedPacing)
    const mergedAutoScript = {
        ...baseAutoScript,
        pacing_budget: resolvedPacing,
    }
    const resolvedAuto = AutoScriptConfigSchema.parse(mergedAutoScript)
    existing.auto_script = resolvedAuto
    if (!existing.series_slug) {
        existing.series_slug = path.basename(seriesDir)
    }
    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2) + '\n', {
        encoding: 'utf8',
    })
    const slug = String(existing.series_slug || path.basename(seriesDir))
    const worldDir = path.join(seriesDir, 'world')
    if (!fs.existsSync(worldDir)) {
        fs.mkdirSync(worldDir, { recursive: true })
    }
    const dossier = buildDramaticCatalystsDossier(resolvedAuto, slug)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '')
    const dossierPath = path.join(worldDir, 'dramatic-catalysts.md')
    fs.writeFileSync(dossierPath, dossier, { encoding: 'utf8' })
    const buf = fs.readFileSync(dossierPath)
    if (!verifyByteZeroBuffer(buf)) {
        throw new Error(
            `[BYTE_ZERO_BREACH] dramatic-catalysts.md failed Byte-0 verification at ${dossierPath}`,
        )
    }
    return resolvedPacing
}

export function renderAsciiPacingCurvePreview(
    pacingInput: unknown,
    ste?: State,
): string[] {
    const pacing = resolvePacingBudgetConfig(
        (pacingInput as any)?.pacing_budget ?? pacingInput ?? {},
    )
    const hours = [0, 4, 6, 9, 12, 15, 18, 21]
    const daypartForHour = (h: number): string => {
        if (h >= 5 && h <= 6) return 'DAWN'
        if (h >= 7 && h <= 11) return 'MORNING'
        if (h >= 12 && h <= 16) return 'AFTERNOON'
        if (h >= 17 && h <= 19) return 'DUSK'
        return 'NIGHT'
    }
    const diurnal = pacing.diurnal_tension_weights_bps as Record<string, number>
    const maxMult = Math.max(
        pacing.act_i_multiplier_bps,
        pacing.act_ii_multiplier_bps,
        pacing.act_iii_multiplier_bps,
    )
    const lines: string[] = []
    lines.push(
        `>> [PACING:CURVE] mode=${pacing.act_window_mode} cooldown=${pacing.min_ticks_between_scenes}t dryMax=${pacing.max_dry_spell_ticks}t`,
    )
    lines.push(
        `>> [PACING:CURVE] ACT_I=${pacing.act_i_multiplier_bps} ACT_II=${pacing.act_ii_multiplier_bps} ACT_III=${pacing.act_iii_multiplier_bps}`,
    )
    for (const h of hours) {
        const dp = daypartForHour(h)
        const w = (diurnal as any)[dp] ?? 10000
        const progress = Math.trunc((h * 10000) / 24)
        const stage =
            progress <= pacing.act_i_end_bps
                ? 'ACT_I'
                : progress <= pacing.act_ii_end_bps
                  ? 'ACT_II'
                  : 'ACT_III'
        const actMult =
            stage === 'ACT_I'
                ? pacing.act_i_multiplier_bps
                : stage === 'ACT_II'
                  ? pacing.act_ii_multiplier_bps
                  : pacing.act_iii_multiplier_bps
        const combined = Number((BigInt(actMult) * BigInt(w)) / 10000n)
        const barLen = Math.max(1, Math.trunc((combined * 24) / (maxMult * 2)))
        const bar = '#'.repeat(Math.min(24, barLen)).padEnd(24, '.')
        const label = `h${String(h).padStart(2, '0')}:${dp.padEnd(9, ' ')}|${bar}| ${stage} ${combined}bps`
        lines.push(label)
    }
    const clean = lines.map((l) => sanitizeAsciiLine(l))
    for (const line of clean) {
        emitConsole(ste, line)
    }
    return clean
}

export interface CharacterVoiceSamplePreview {
    entityId: string
    cue: string
    defaultParenthetical: string
    samplesByCategory: Record<
        SignificantEventCategory,
        {
            sceneHeading: string
            actionLine: string
            characterCue: string
            parenthetical: string
            dialogue: string
            transition: string
        }
    >
}

export function previewCharacterVoiceSample(
    rawEntity: Record<string, any>,
): CharacterVoiceSamplePreview {
    const profile = buildCharacterVoiceProfile(rawEntity ?? {})
    const palette = buildEventDramaticPalette()
    const samplesByCategory =
        {} as CharacterVoiceSamplePreview['samplesByCategory']

    for (const cat of ALL_CATEGORIES) {
        const tmpl = palette[cat]
        const parenthetical =
            profile.parentheticalsByCategory[cat]?.[0] ||
            profile.defaultParenthetical
        const dialogue =
            profile.linesByCategory[cat]?.[0] || tmpl.dialogue[0] || 'Hold.'
        samplesByCategory[cat] = {
            sceneHeading: tmpl.sceneHeading,
            actionLine: tmpl.actionLines[0] || '',
            characterCue: profile.cue,
            parenthetical,
            dialogue,
            transition: tmpl.transitions[0] || 'CUT TO:',
        }
    }

    return Object.freeze({
        entityId: profile.entityId,
        cue: profile.cue,
        defaultParenthetical: profile.defaultParenthetical,
        samplesByCategory: Object.freeze({ ...samplesByCategory }),
    })
}

async function promptBlessedTextInput(
    lib: any,
    net: any,
    txt: string,
    initialValue: string,
): Promise<string | null> {
    const inputRes = await lib.hunt('[Open action] Open Input', {
        txt,
        src: initialValue,
        dat: { clr0: 0, clr1: 3 },
        net,
    })
    const rawStr = String(
        inputRes?.putBit?.src ?? inputRes?.inpBit?.src ?? '',
    ).trim()
    if (inputRes?.putBit?.val === -1 || rawStr.length === 0) {
        return null
    }
    return rawStr
}

export async function runPacingBudgetSubmenu(
    seriesDir: string,
    autoConfig: AutoScriptConfig,
    lib: any,
    net: any,
    ste?: State,
): Promise<PacingBudgetConfig> {
    let pacing = resolvePacingBudgetConfig(
        (autoConfig as any)?.pacing_budget ?? {},
    )
    emitConsole(
        ste,
        `>> [PACING:CONFIG] cooldown=${pacing.min_ticks_between_scenes}t dryMax=${pacing.max_dry_spell_ticks}t mode=${pacing.act_window_mode} I=${pacing.act_i_multiplier_bps} II=${pacing.act_ii_multiplier_bps} III=${pacing.act_iii_multiplier_bps}`,
    )
    try {
        const pacingChoice = await lib.hunt('[Open action] Open Choice', {
            dat: { clr0: 0, clr1: 3 },
            src: 'VERTICAL',
            lst: [...PACING_SUBMENU_CHOICES],
            net,
        })
        const picked = String(pacingChoice?.chcBit?.src || '')
        if (picked === PACING_SUBMENU_CHOICES[0]) {
            const rawStr = await promptBlessedTextInput(
                lib,
                net,
                'MIN_TICKS_BETWEEN_SCENES (0-1000):',
                String(pacing.min_ticks_between_scenes),
            )
            if (rawStr !== null) {
                pacing = applyPacingBudgetPatch(seriesDir, {
                    min_ticks_between_scenes: Number(rawStr),
                })
                emitConsole(
                    ste,
                    `>> [PACING:CONFIG] Updated min_ticks_between_scenes=${pacing.min_ticks_between_scenes}`,
                )
            } else {
                emitConsole(ste, ':: [PACING:CANCEL] Pacing update cancelled.')
            }
        } else if (picked === PACING_SUBMENU_CHOICES[1]) {
            const rawStr = await promptBlessedTextInput(
                lib,
                net,
                'MAX_DRY_SPELL_TICKS (1-2000):',
                String(pacing.max_dry_spell_ticks),
            )
            if (rawStr !== null) {
                pacing = applyPacingBudgetPatch(seriesDir, {
                    max_dry_spell_ticks: Number(rawStr),
                })
                emitConsole(
                    ste,
                    `>> [PACING:CONFIG] Updated max_dry_spell_ticks=${pacing.max_dry_spell_ticks}`,
                )
            } else {
                emitConsole(ste, ':: [PACING:CANCEL] Pacing update cancelled.')
            }
        } else if (picked === PACING_SUBMENU_CHOICES[2]) {
            const rawStr = await promptBlessedTextInput(
                lib,
                net,
                'ACT MULTIPLIERS BPS (I,II,III comma-separated):',
                `${pacing.act_i_multiplier_bps},${pacing.act_ii_multiplier_bps},${pacing.act_iii_multiplier_bps}`,
            )
            if (rawStr !== null) {
                const parts = rawStr.split(',').map((s) => Number(s.trim()))
                if (
                    parts.length !== 3 ||
                    parts.some((n) => !Number.isFinite(n))
                ) {
                    emitConsole(
                        ste,
                        ':: [PACING:ERR] Expected 3 comma-separated integer multipliers (I,II,III).',
                    )
                } else {
                    pacing = applyPacingBudgetPatch(seriesDir, {
                        act_i_multiplier_bps: parts[0],
                        act_ii_multiplier_bps: parts[1],
                        act_iii_multiplier_bps: parts[2],
                    })
                    emitConsole(
                        ste,
                        `>> [PACING:CONFIG] Updated act multipliers I=${pacing.act_i_multiplier_bps} II=${pacing.act_ii_multiplier_bps} III=${pacing.act_iii_multiplier_bps}`,
                    )
                }
            } else {
                emitConsole(ste, ':: [PACING:CANCEL] Pacing update cancelled.')
            }
        } else if (picked === PACING_SUBMENU_CHOICES[3]) {
            const nextMode =
                pacing.act_window_mode === 'HORIZON_PERCENT'
                    ? 'SOLAR_24H_CYCLE'
                    : 'HORIZON_PERCENT'
            pacing = applyPacingBudgetPatch(seriesDir, {
                act_window_mode: nextMode,
            })
            emitConsole(
                ste,
                `>> [PACING:CONFIG] Toggled act_window_mode=${pacing.act_window_mode}`,
            )
        } else if (picked === PACING_SUBMENU_CHOICES[4]) {
            renderAsciiPacingCurvePreview(pacing, ste)
        }
    } catch (err: any) {
        emitConsole(ste, `:: [PACING:ERR] ${err?.message || String(err)}`)
    }
    return pacing
}

function loadSeriesAutoScriptConfig(seriesDir: string): AutoScriptConfig {
    const configPath = path.join(seriesDir, 'series.config.json')
    if (!fs.existsSync(configPath)) {
        return DEFAULT_AUTO_SCRIPT_CONFIG
    }
    try {
        const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        return AutoScriptConfigSchema.parse(raw?.auto_script ?? {})
    } catch {
        return DEFAULT_AUTO_SCRIPT_CONFIG
    }
}

export const runAutoScriptMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const dat = (bal?.dat || {}) as Record<string, any>
    const lib = (globalThis as any).LIBRARY

    // 1. Headless programmatic patch
    if (dat.patch && dat.seriesDir) {
        try {
            const resolved = applyAutoScriptConfigPatch(
                dat.seriesDir,
                dat.patch,
            )
            emitConsole(
                ste,
                `>> [AUTO_SCRIPT:CONFIG] Saved threshold=${resolved.min_global_significance_bps}bps rules=${resolved.rules.length} subdir=${resolved.output_subdir}`,
            )
            if (bal?.slv) {
                bal.slv({
                    mnuBit: {
                        idx: bal.idx || 'auto-script-menu',
                        val: 1,
                        dat: { autoScript: resolved },
                    },
                })
            }
            return cpy
        } catch (err: any) {
            emitConsole(
                ste,
                `:: [AUTO_SCRIPT:ERR] ${err?.message || String(err)}`,
            )
            if (bal?.slv) {
                bal.slv({
                    mnuBit: {
                        idx: bal.idx || 'auto-script-menu',
                        val: -1,
                        dat: { error: err?.message || String(err) },
                    },
                })
            }
            return cpy
        }
    }

    // 2b. Headless pacing budget patch (fail-closed before disk mutation)
    if (
        (dat.pacingPatch || dat.action === 'CONFIGURE_PACING_BUDGET') &&
        dat.seriesDir
    ) {
        try {
            const resolvedPacing = applyPacingBudgetPatch(
                dat.seriesDir,
                (dat.pacingPatch as Record<string, any>) ??
                    (dat.patch as Record<string, any>) ??
                    {},
            )
            emitConsole(
                ste,
                `>> [PACING:CONFIG] Saved cooldown=${resolvedPacing.min_ticks_between_scenes}t dryMax=${resolvedPacing.max_dry_spell_ticks}t mode=${resolvedPacing.act_window_mode}`,
            )
            if (bal?.slv) {
                bal.slv({
                    mnuBit: {
                        idx: bal.idx || 'auto-script-menu',
                        val: 1,
                        dat: { pacing: resolvedPacing },
                    },
                })
            }
            return cpy
        } catch (err: any) {
            emitConsole(ste, `:: [PACING:ERR] ${err?.message || String(err)}`)
            if (bal?.slv) {
                bal.slv({
                    mnuBit: {
                        idx: bal.idx || 'auto-script-menu',
                        val: -1,
                        dat: { error: err?.message || String(err) },
                    },
                })
            }
            return cpy
        }
    }

    // 2c. Headless pacing curve preview
    if (dat.previewPacing || dat.action === 'PREVIEW_PACING_CURVE') {
        const fallbackDir =
            (dat.seriesDir as string) ||
            (dat.repoRoot
                ? path.join(String(dat.repoRoot), 'series', '000.sample-hearth')
                : '')
        const pacingForPreview = resolvePacingBudgetConfig(
            (() => {
                try {
                    return (
                        (loadSeriesAutoScriptConfig(fallbackDir) as any)
                            ?.pacing_budget ?? {}
                    )
                } catch {
                    return {}
                }
            })(),
        )
        const lines = renderAsciiPacingCurvePreview(pacingForPreview, ste)
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: bal.idx || 'auto-script-menu',
                    val: 1,
                    dat: { preview: lines },
                },
            })
        }
        return cpy
    }

    // 2. Headless programmatic character voice sample preview
    if (dat.preview || dat.action === 'PREVIEW_VOICE') {
        const sample = previewCharacterVoiceSample(
            dat.entity ?? {
                id: 'char_johnny',
                name: 'Johnny Walkman',
                voice_notes: 'Short declarative sentences.',
            },
        )
        emitConsole(
            ste,
            `>> [AUTO_SCRIPT:VOICE] Previewed ${sample.cue} (${sample.entityId}) across 6 Fountain categories`,
        )
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: bal.idx || 'auto-script-menu',
                    val: 1,
                    dat: { preview: sample },
                },
            })
        }
        return cpy
    }

    // 3. Resolve active series and emit inspection summary
    const repoRoot = dat.repoRoot || resolveRepoRoot()
    const seriesSlug =
        dat.activeSeries || cpy?.activeSeries || '000.sample-hearth'
    const seriesDir = dat.seriesDir || path.join(repoRoot, 'series', seriesSlug)
    const config = loadSeriesAutoScriptConfig(seriesDir)
    let activeConfig = config
    const activeCount = activeConfig.rules.filter((r) => r.enabled).length

    emitConsole(
        ste,
        `>> [AUTO_SCRIPT:CONFIG] Series=${seriesSlug} | Enabled=${activeConfig.enabled} | GlobalMin=${activeConfig.min_global_significance_bps}bps | ActiveRules=${activeCount}/${activeConfig.rules.length} | Output=${activeConfig.output_subdir}`,
    )

    // 4. Interactive Blessed Curses Submenu with strict net mesh binding
    if (lib && typeof lib.hunt === 'function' && !dat.headless) {
        try {
            const gridBit = await lib.hunt('[Grid action] Update Grid', {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: 8,
            })
            const net = gridBit?.grdBit?.dat
            const choiceRes = await lib.hunt('[Open action] Open Choice', {
                dat: { clr0: 0, clr1: 3 },
                src: 'VERTICAL',
                lst: [...AUTO_SCRIPT_SUBMENU_CHOICES],
                net,
            })
            const picked = String(choiceRes?.chcBit?.src || '')

            if (picked === AUTO_SCRIPT_SUBMENU_CHOICES[0]) {
                for (const rule of activeConfig.rules) {
                    emitConsole(
                        ste,
                        `>> [AUTO_SCRIPT:RULE] ${rule.category} enabled=${rule.enabled} min=${rule.min_severity_bps}bps cooldown=${rule.cooldown_ticks} weight=${rule.priority_weight_bps}bps`,
                    )
                }
            } else if (picked === AUTO_SCRIPT_SUBMENU_CHOICES[1]) {
                const rawStr = await promptBlessedTextInput(
                    lib,
                    net,
                    'GLOBAL_MIN_SIGNIFICANCE_BPS (0-10000):',
                    String(activeConfig.min_global_significance_bps),
                )
                if (rawStr !== null) {
                    const rawVal = Number(rawStr)
                    activeConfig = applyAutoScriptConfigPatch(seriesDir, {
                        min_global_significance_bps: rawVal,
                    })
                    emitConsole(
                        ste,
                        `>> [AUTO_SCRIPT:CONFIG] Updated min_global_significance_bps=${activeConfig.min_global_significance_bps}`,
                    )
                } else {
                    emitConsole(
                        ste,
                        ':: [AUTO_SCRIPT:CANCEL] Threshold update cancelled.',
                    )
                }
            } else if (picked === AUTO_SCRIPT_SUBMENU_CHOICES[2]) {
                const catRes = await lib.hunt('[Open action] Open Choice', {
                    dat: { clr0: 0, clr1: 3 },
                    src: 'VERTICAL',
                    lst: activeConfig.rules.map((r) => r.category),
                    net,
                })
                const cat = String(catRes?.chcBit?.src || '')
                if (cat) {
                    const nextRules = activeConfig.rules.map((r) =>
                        r.category === cat ? { ...r, enabled: !r.enabled } : r,
                    )
                    activeConfig = applyAutoScriptConfigPatch(seriesDir, {
                        rules: nextRules,
                    })
                    emitConsole(
                        ste,
                        `>> [AUTO_SCRIPT:CONFIG] Toggled ${cat} (${activeConfig.rules.filter((r) => r.enabled).length} active)`,
                    )
                }
            } else if (picked === AUTO_SCRIPT_SUBMENU_CHOICES[3]) {
                const sample = previewCharacterVoiceSample({
                    id: 'char_sample',
                    name: 'Johnny Walkman',
                    voice_notes: 'Measured, keeping eyes on the ledger.',
                })
                const first = sample.samplesByCategory.PARANOIA_TRIGGERED
                emitConsole(
                    ste,
                    `>> [AUTO_SCRIPT:VOICE] ${first.sceneHeading} | ${first.characterCue} ${first.parenthetical} "${first.dialogue}"`,
                )
            } else if (picked === AUTO_SCRIPT_SUBMENU_CHOICES[4]) {
                await runPacingBudgetSubmenu(
                    seriesDir,
                    activeConfig,
                    lib,
                    net,
                    ste,
                )
            }
        } catch (err: any) {
            emitConsole(
                ste,
                `:: [AUTO_SCRIPT:ERR] ${err?.message || String(err)}`,
            )
        }
    }

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: bal.idx || 'auto-script-menu',
                val: 1,
                lst: [...AUTO_SCRIPT_SUBMENU_CHOICES],
                dat: { autoScript: activeConfig },
            },
        })
    }
    return cpy
}
