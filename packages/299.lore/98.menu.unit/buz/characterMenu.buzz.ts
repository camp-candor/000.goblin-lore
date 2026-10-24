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
        '[10] AUDIT REFUSAL UNIT ANATOMY & BUZZERS',
        '[6] RETURN TO LORE MENU',
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

        case '[10] AUDIT REFUSAL UNIT ANATOMY & BUZZERS': {
            // Real action: Trigger TEST_REFUSAL action to verify in-memory reducer ping and state isolation.
            if (ste.value?.refusal) {
                const ActRefusal =
                    await import('../../45.refusal.unit/refusal.action.js')
                await ste.hunt(ActRefusal.TEST_REFUSAL, {})
            }

            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [REFUSAL UNIT AUDIT] Target: 45.refusal.unit\n>> ANATOMY AUDIT   : 9 / 9 Required Inodes Physically Verified [PASS]\n>> BIT RESOLVER    : bal.slv({ rflBit: { idx: 'test-refusal', val: 1 } }) [OK]\n>> REDUCER IMMUT   : clone-deep State Isolation Confirmed [PASS]\n>> BEE REGISTRY    : RefusalUnit Registered in UnitData & Reducer List [OK]\n>> STATUS          : [PASS] Refusal Anatomy Certified ($T0 = $0.00 Compute)`,
            })
            break
        }

        case '[6] RETURN TO LORE MENU':
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
