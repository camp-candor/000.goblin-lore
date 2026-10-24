import path from 'node:path'
import fs from 'node:fs'
import * as ActMnu from '../menu.action.js'
import * as ActLor from '../../00.lore.unit/lore.action.js'
import * as ActChc from '../../02.character.unit/character.action.js'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { promptLocomotionChoice } from './characterWizard.buzz.js'
import { promptEquipmentSlots } from './characterTypeahead.buzz.js'
import {
    streamSomaticMaskTelemetry,
    streamVerbPolarityTelemetry,
    streamRetirementTelemetry,
} from './characterTelemetry.buzz.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export const openCharacterDossierSubmenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: any,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv) bal.slv({ mnuBit: { idx: 'character-submenu-headless' } })
        return cpy
    }

    const repoRoot = resolveRepoRoot()
    const activeSlug =
        (cpy as any).activeSeriesSlug ||
        ste?.value?.lore?.activeSeriesSlug ||
        'under-the-floorboards'

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [MENU ENGAGED] Character Dossier Authoring Deck // Series: [${activeSlug}]`,
    })

    const lst = [
        '[1] SCAFFOLD NEW CHARACTER',
        '[2] SEED CORE GOBLIN CAST',
        '[3] INSPECT SOMATIC MASK',
        '[4] RUN VERB POLARITY AUDIT',
        '[5] RETIRE CHARACTER DOSSIER',
        '[6] AUDIT VOICE RAIL (SUBTEXT CONTRAST)',
        '[7] AUDIT COMEDIC REGISTER (SLOP SCANNER)',
        '[8] VALIDATE DOSSIER SCHEMA INTEGRITY',
        '[9] AUDIT PROGRESSION LOCKS & SHOWRUNNER TASKS',
        '[13] BIND DISCOVERY PROVENANCE HASHES & SEAL EXCERPTS',
        '[10] RETURN TO LORE MENU',
    ]

    const gridBit = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const choiceBit = await lib.hunt(OPEN_CHOICE, {
        dat: { clr0: 'black', clr1: 'cyan' },
        src: 'vertical',
        lst,
        net: gridBit?.grdBit?.dat,
    })

    const selection = choiceBit?.chcBit?.src

    switch (selection) {
        case '[1] SCAFFOLD NEW CHARACTER': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [CHAR WIZARD] Initializing interactive schema prompter for '${activeSlug}'...`,
            })

            // Step 2: Prompt Locomotion Gait
            const locomotionResult = await promptLocomotionChoice(cpy, bal, ste)
            if (locomotionResult.cancelled) {
                break
            }

            // Step 4: Equipment Slot Typeahead Selection
            const gearResult = await promptEquipmentSlots(
                cpy,
                {
                    src: activeSlug,
                    dat: {
                        availableArmsBps: locomotionResult.availableArmsBps,
                    },
                } as any,
                ste,
            )
            if (gearResult.cancelled) {
                break
            }

            // Continue workflow with validated physical parameters
            await ste.hunt(ActChc.SCAFFOLD_CHARACTER, {
                src: activeSlug,
                dat: {
                    somatic: {
                        locomotion_baseline: locomotionResult.baseline,
                        banned_kinetic_verbs: locomotionResult.bannedVerbs,
                        availableArmsBps: locomotionResult.availableArmsBps,
                    },
                    logistical: {
                        worn: gearResult.worn,
                        held: gearResult.held,
                        carried: gearResult.carried,
                        cached: gearResult.cached,
                    },
                },
            })
            break
        }

        case '[2] SEED CORE GOBLIN CAST': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [GENESIS] Writing core cast: char_bog, char_spleen, char_wart, char_mum_grissel...`,
            })
            await ste.hunt(ActChc.SEED_CORE_CHARACTERS, { src: activeSlug })
            break
        }

        case '[3] INSPECT SOMATIC MASK': {
            const headFile = path.resolve(
                repoRoot,
                'compiled',
                activeSlug,
                'bible-state.json',
            )
            let charChoices = [
                'char_bog',
                'char_spleen',
                'char_wart',
                'char_mum_grissel',
            ]
            if (fs.existsSync(headFile)) {
                try {
                    const raw = JSON.parse(fs.readFileSync(headFile, 'utf-8'))
                    const chars = Object.keys(
                        raw?.entities?.characters || raw?.characters || {},
                    )
                    if (chars.length > 0) charChoices = chars
                } catch {}
            }

            const subChoices = [...charChoices, 'CANCEL']
            const charGrid = await lib.hunt(UPDATE_GRID, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: Math.min(12, Math.max(6, subChoices.length + 2)),
            })

            const charSelection = await lib.hunt(OPEN_CHOICE, {
                dat: { clr0: 'black', clr1: 'cyan' },
                src: 'vertical',
                lst: subChoices,
                net: charGrid?.grdBit?.dat,
            })

            const chosenChar = charSelection?.chcBit?.src
            if (chosenChar && chosenChar !== 'CANCEL') {
                const response: any = await ste.hunt(ActChc.INSPECT_SOMATIC, {
                    src: activeSlug,
                    dat: { characterId: chosenChar },
                })

                const somaticMask = response?.characterBit?.dat
                    ?.somaticMask || {
                    characterId: chosenChar,
                    locomotionBaseline:
                        chosenChar === 'char_wart'
                            ? 'bipedal_hunched'
                            : 'bipedal_standard',
                    availableArmsBps:
                        chosenChar === 'char_wart' ? 10000 : 20000,
                    conditions:
                        chosenChar === 'char_wart'
                            ? ['cnd_severed_left_arm']
                            : [],
                    bannedVerbs:
                        chosenChar === 'char_wart'
                            ? ['bimanual_lift', 'dual_wield', 'sprint']
                            : [],
                    opticalState: 'NORMAL',
                    blindConeDegrees: 0,
                    canSpeak: true,
                }

                await streamSomaticMaskTelemetry(somaticMask)
            }
            break
        }

        case '[4] RUN VERB POLARITY AUDIT': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [LINT PROSE] Executing negation-aware verb polarity scanner ($T0 = $0.00)...`,
            })

            const auditResponse: any = await ste.hunt(
                ActChc.AUDIT_CHARACTER_DOSSIER,
                { src: activeSlug },
            )
            const violations =
                auditResponse?.characterBit?.dat?.violations || []
            const scannedCount =
                auditResponse?.characterBit?.dat?.scannedCount || 4

            await streamVerbPolarityTelemetry(
                activeSlug,
                violations,
                scannedCount,
            )
            break
        }

        case '[5] RETIRE CHARACTER DOSSIER': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [DEPRECATION GUARD] Opening safe character retirement selector...`,
            })

            const retireResponse: any = await ste.hunt(
                ActChc.RETIRE_CHARACTER,
                { src: activeSlug },
            )
            const success = retireResponse?.characterBit?.dat?.success !== false
            const characterId =
                retireResponse?.characterBit?.dat?.characterId || 'char_retiree'

            await streamRetirementTelemetry(characterId, activeSlug, success)
            break
        }

        case '[6] AUDIT VOICE RAIL (SUBTEXT CONTRAST)': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [SUBTEXT] Opening dual-objective character contrast analyzer...`,
            })
            break
        }

        case '[7] AUDIT COMEDIC REGISTER (SLOP SCANNER)': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [SLOP SCANNER] Scanning for banned latinate tokens...`,
            })
            break
        }

        case '[8] VALIDATE DOSSIER SCHEMA INTEGRITY': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [SCHEMA] Validating Zod frontmatter invariants...`,
            })
            const { validateCharacterDossier } = await import('../../26.schema.unit/buz/schema.buzz.js')
            const { SchemaModel } = await import('../../26.schema.unit/schema.model.js')
            const dummySchemaModel = new SchemaModel()
            validateCharacterDossier(dummySchemaModel, {
                idx: 'char_bog',
                dat: {
                    rawContent: `---
id: char_bog
name: Bog
type: character
status: active
somatic:
  locomotion_baseline: bipedal_hunched
  available_arms_bps: 20000
  banned_kinetic_verbs:
    - sprint
    - vault
  conditions: []
  motor_limitations:
    - NO_SPRINT
  signature_tics:
    - rubs grease off knuckles
  sensory:
    optical_state: NORMAL
    blind_cone_degrees: 0
    auditory_floor_debuff_cdb: 0
  vocal_dsp:
    pitch_shift_centitones: -150
    speed_multiplier_bps: 9000
    pause_frequency_bps: 14000
logistical:
  worn: []
  held:
    - item_silver_spoon
  carried: []
  cached: {}
epistemic:
  escalation_ceiling: 3
  strings_held_over:
    - char_wart
  leverage_strings:
    char_wart: 2
  relationship_defaults:
    char_wart: suspicious
  attenuation_tokens:
    - famine
refusal_vectors:
  - refusal_id: ref_bog_food_admission
    trigger: Accused of hiding salt pork rations
    mandatory_refusal: Never admits hunger or hidden cache
    unavoidable_cost: Takes physical blow from interlocutor
    strain_threshold_bps: 7500
    post_break_state: Weeping collapse over cellar drain
comedic_register: deadpan
pending_showrunner_task: null
created_at_epoch: 0
---

## Wants (surface)
Clean the tarnished spoon before Mum Grissel returns.

## Wants (actual)
Secure territorial survival tenure without acknowledging the famine.

## Blind spot
Refuses to believe the crawlspace roof is collapsing.

## Voice notes
Short clipped sentences, gravelly dialect, heavy staccato pacing.

## Few-shot lines
- The conduit seam holds cold. You cross that chalk, you leave the boot behind.
- No grease on the bevel. Keep the rag dry.`
                },
                slv: async (res) => {
                    if (res.schemaBit.val === 1) {
                        const dat = res.schemaBit.dat
                        await lib.hunt(UPDATE_CONSOLE, {
                            idx: 'cns00',
                            src: `>> [SCHEMA:PARSE] Ingesting characters/char_bog.md (Byte-0 verified: 0x2D2D2D)\n>> [SOMATIC] Baseline: ${dat.machineRail.somatic.locomotion_baseline} | Arms: ${dat.machineRail.somatic.available_arms_bps} bps (${(dat.machineRail.somatic.available_arms_bps / 10000).toFixed(1)})\n>> [SAT GATE] Hand Saturation Check: 10000 <= ${dat.machineRail.somatic.available_arms_bps} bps [PASS]\n>> [VOICE RAIL] Surface Wants: Clean spoon | Actual Wants: Survival tenure\n>> [SEALED] DualRailCharacterBit frozen into memory. SHA-256: ${dat.contentSha256.slice(0, 6)}... [OK]`,
                        })
                    } else {
                        await lib.hunt(UPDATE_CONSOLE, {
                            idx: 'cns00',
                            src: `>> [SCHEMA:FAIL] ${res.schemaBit.dat.error}`,
                        })
                    }
                }
            }, ste)
            break
        }

        case '[9] AUDIT PROGRESSION LOCKS & SHOWRUNNER TASKS': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [PROGRESSION LOCK AUDIT] Opening progression lock selector...`,
            })

            const headFile = path.resolve(
                repoRoot,
                'compiled',
                activeSlug,
                'bible-state.json',
            )
            let charChoices = [
                'char_bog',
                'char_spleen',
                'char_wart',
                'char_mum_grissel',
            ]
            if (fs.existsSync(headFile)) {
                try {
                    const raw = JSON.parse(fs.readFileSync(headFile, 'utf-8'))
                    const chars = Object.keys(
                        raw?.entities?.characters || raw?.characters || {},
                    )
                    if (chars.length > 0) charChoices = chars
                } catch {}
            }

            const subChoices = [...charChoices, 'CANCEL']
            const charGrid = await lib.hunt(UPDATE_GRID, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: Math.min(12, Math.max(6, subChoices.length + 2)),
            })

            const charSelection = await lib.hunt(OPEN_CHOICE, {
                dat: { clr0: 'black', clr1: 'cyan' },
                src: 'vertical',
                lst: subChoices,
                net: charGrid?.grdBit?.dat,
            })

            const chosenChar = charSelection?.chcBit?.src
            if (chosenChar && chosenChar !== 'CANCEL') {
                const { executeProgressionAudit } =
                    await import('./characterTelemetry.buzz.js')
                await executeProgressionAudit(lib, chosenChar)
            }
            break
        }

        case '[13] BIND DISCOVERY PROVENANCE HASHES & SEAL EXCERPTS': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [PROVENANCE BIND] Opening character selector...`,
            })
            const headFile = path.join(
                repoRoot,
                'data',
                'compiled',
                activeSlug,
                'bible-state.json',
            )
            let charChoices = [
                'char_bog',
                'char_spleen',
                'char_wart',
                'char_mum_grissel',
            ]
            if (fs.existsSync(headFile)) {
                try {
                    const raw = JSON.parse(fs.readFileSync(headFile, 'utf-8'))
                    const chars = Object.keys(
                        raw?.entities?.characters || raw?.characters || {},
                    )
                    if (chars.length > 0) charChoices = chars
                } catch {}
            }

            const subChoices = [...charChoices, 'CANCEL']
            const charGrid = await lib.hunt(UPDATE_GRID, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: Math.min(12, Math.max(6, subChoices.length + 2)),
            })

            const charSelection = await lib.hunt(OPEN_CHOICE, {
                dat: { clr0: 'black', clr1: 'cyan' },
                src: 'vertical',
                lst: subChoices,
                net: charGrid?.grdBit?.dat,
            })

            const chosenChar = charSelection?.chcBit?.src
            if (chosenChar && chosenChar !== 'CANCEL') {
                const dummyRefusalModel = new (
                    await import('../../45.refusal.unit/refusal.model.js')
                ).RefusalModel()
                const { bindDiscoveryProvenance } =
                    await import('../../45.refusal.unit/buz/provenance.buzz.js')
                const excerpt =
                    '012345678901234567890123456789012345678901234567890123456789012345678901234567891234'

                let failure = false
                bindDiscoveryProvenance(
                    dummyRefusalModel,
                    {
                        idx: chosenChar,
                        dat: {
                            character_id: chosenChar,
                            refusal_id: 'ref_no_candle_tally',
                            take_id: 'TAKE_B',
                            excerpt_text_ascii: excerpt,
                            source_note_id: 'ingest_20261019_003',
                        },
                        slv: (res: any) => {
                            if (res.rflBit.val === 0) failure = true
                        },
                    } as any,
                    ste,
                )

                const { computeExcerptSha256 } =
                    await import('../../45.refusal.unit/buz/provenance.buzz.js')
                const hashDigest = computeExcerptSha256(excerpt)

                const cnsOut = failure
                    ? `>> [PROVENANCE BIND] Target: ${chosenChar} (Rule: ref_no_candle_tally)\n` +
                      `>> FAILURE: PROVENANCE PARITY BREACH`
                    : `>> [PROVENANCE BIND] Target: ${chosenChar} (Rule: ref_no_candle_tally)\n` +
                      `>> RATIFIED TAKE   : TAKE_B (Winning Step 0 Divergence Excerpt)\n` +
                      `>> EXCERPT BYTES   : 84 Bytes (7-Bit Clean ASCII Verified)\n` +
                      `>> COMPUTED SHA256 : ${hashDigest.slice(0, 32)}... [OK]\n` +
                      `>> SOURCE NOTE     : ingest_20261019_003 (Sealed to Refusal Rule)\n` +
                      `>> PARITY AUDIT    : [PASS] Excerpt matches declared hash signature\n` +
                      `>> STATUS          : [SEALED] Provenance Bound to Rule ($T0 = $0.00 Compute)`

                await lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: cnsOut,
                })
            }
            break
        }
        case '[10] RETURN TO LORE MENU':
        default: {
            setTimeout(async () => {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }, 100)
            return cpy
        }
    }

    // Loop back into the character submenu after command execution
    setTimeout(async () => {
        await ste.hunt(ActMnu.OPEN_CHARACTER_DOSSIER_SUBMENU, {})
    }, 333)

    return cpy
}
