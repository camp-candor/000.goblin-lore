import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import { resolveRepoRoot } from '../../29.series.unit/buz/scaffoldSeriesTree.buzz.js'
import {
    AutoScriptConfigSchema,
    DEFAULT_AUTO_SCRIPT_CONFIG,
    type AutoScriptConfig,
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
    '[<] RETURN TO LORE MENU',
])

export const AUTO_SCRIPT_MENU_CHOICES = AUTO_SCRIPT_SUBMENU_CHOICES

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
    const activeCount = config.rules.filter((r) => r.enabled).length

    emitConsole(
        ste,
        `>> [AUTO_SCRIPT:CONFIG] Series=${seriesSlug} | Enabled=${config.enabled} | GlobalMin=${config.min_global_significance_bps}bps | ActiveRules=${activeCount}/${config.rules.length} | Output=${config.output_subdir}`,
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
                lst: [...AUTO_SCRIPT_SUBMENU_CHOICES],
                net,
            })
            const picked = String(choiceRes?.chcBit?.src || '')

            if (picked === AUTO_SCRIPT_SUBMENU_CHOICES[0]) {
                for (const rule of config.rules) {
                    emitConsole(
                        ste,
                        `>> [AUTO_SCRIPT:RULE] ${rule.category} enabled=${rule.enabled} min=${rule.min_severity_bps}bps cooldown=${rule.cooldown_ticks} weight=${rule.priority_weight_bps}bps`,
                    )
                }
            } else if (picked === AUTO_SCRIPT_SUBMENU_CHOICES[1]) {
                const inputRes = await lib.hunt('[Open action] Open Input', {
                    src: 'GLOBAL_MIN_SIGNIFICANCE_BPS (0-10000):',
                    net,
                })
                const rawVal = Number(inputRes?.inpBit?.src ?? '')
                const updated = applyAutoScriptConfigPatch(seriesDir, {
                    min_global_significance_bps: rawVal,
                })
                emitConsole(
                    ste,
                    `>> [AUTO_SCRIPT:CONFIG] Updated min_global_significance_bps=${updated.min_global_significance_bps}`,
                )
            } else if (picked === AUTO_SCRIPT_SUBMENU_CHOICES[2]) {
                const catRes = await lib.hunt('[Open action] Open Choice', {
                    lst: config.rules.map((r) => r.category),
                    net,
                })
                const cat = String(catRes?.chcBit?.src || '')
                if (cat) {
                    const nextRules = config.rules.map((r) =>
                        r.category === cat ? { ...r, enabled: !r.enabled } : r,
                    )
                    const updated = applyAutoScriptConfigPatch(seriesDir, {
                        rules: nextRules,
                    })
                    emitConsole(
                        ste,
                        `>> [AUTO_SCRIPT:CONFIG] Toggled ${cat} (${updated.rules.filter((r) => r.enabled).length} active)`,
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
                dat: { autoScript: config },
            },
        })
    }
    return cpy
}
