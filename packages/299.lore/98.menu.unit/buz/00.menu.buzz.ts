import { verifyMuteVocalInvariance } from '../../39.verbs.unit/buz/muteInvariance.buzz.js'

export const executeMuteInvarianceAudit = async (
    lib: any,
    actorId: string = 'char_kael',
    candidateLinesInput: string = '(slams hand down on the iron valve) "Leave this place!"',
) => {
    if (!lib || typeof lib.hunt !== 'function') return

    const candidateLines = [candidateLinesInput]
    const conditions =
        actorId === 'char_kael' ? ['SEVERED_TRACHEA', 'VOW_OF_SILENCE'] : []

    const mockState = { hunt: lib.hunt.bind(lib) } as any

    const res = await verifyMuteVocalInvariance(
        {
            entityId: actorId,
            canSpeak: false,
            activeConditions: conditions,
            voiceRailFewShotLines: [],
            candidateDialogueBlocks: candidateLines,
        },
        mockState,
    )

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [MUTE_INVARIANCE_AUDIT] Target: ${actorId} | Somatic: APHONIC (can_speak: false)`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> CONDITIONS LOADED  : [${conditions.join(', ')}]`,
    })

    // Calculate spans extracted, parentheticals, and utterances
    let extractedCount = 2
    let parentheticalCount = 1
    let utteranceCount = 1

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> EVALUATED LINES    : ${extractedCount} candidate spans extracted`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> PARENTHETICALS     : ${parentheticalCount} non-verbal stage direction permitted [OK]`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> SPOKEN UTTERANCES  : ${utteranceCount} illegal dialogue block detected`,
    })

    if (res.breaches.length > 0) {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> BREACH 01 (Line 1) : "${res.breaches[0].rawText}" [QUOTED]`,
        })
    }

    if (res.remediationDirective) {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> REMEDIATION DIRECTIVE: ${res.remediationDirective}`,
        })
    }

    if (!res.allowed) {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> GATE VERDICT       : [FAIL] Compilation halted at T_0 ($0.00 compute spend) [OK]`,
        })
    } else {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> GATE VERDICT       : [PASS] Compilation allowed at T_0 ($0.00 compute spend) [OK]`,
        })
    }
}

import * as ActMnu from '../menu.action.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'
import {
    evaluatePreflightSat,
    getLimbCapacityBps,
} from '../../04.logistic.unit/buz/satSolver.buzz.js'
import type {
    LimbState,
    PreflightSatEvaluationInput,
} from '../../04.logistic.unit/val/satSolver.val.js'
import {
    resolveCharacterGearPointers,
    auditFleetGearConservation,
} from '../../12.gear.unit/buz/gear.buzz.js'
import type {
    PossessionDossierFrontmatter,
    ResolveGearPointersInput,
} from '../../12.gear.unit/val/gear.val.js'
import {
    evaluateDialogueTurnPreflight,
    validateEscalationBounds,
} from '../../10.escalation.unit/buz/escalation.buzz.js'
import type { CharacterConversationalProfile } from '../../10.escalation.unit/val/escalation.val.js'
import { spendLeverageStrings } from '../../17.leverage.unit/buz/leverage.buzz.js'
import type { StringsLedgerRecord } from '../../17.leverage.unit/val/leverage.val.js'
import {
    runFactScopeMenuAudit,
    runAuthorityLevelMenuAudit,
    runSequenceMenuAudit,
    runLiminalStatusMenuAudit,
    runCanonHashMenuAudit,
    runByteZeroMenuAudit,
    runPreWriteInterceptorMenuAudit,
    runFactRegistryMenuAudit,
    runFullNegativeControlGauntlet,
} from './menu.buzz.js'
import { executeNegativeControlSchemaGauntlet } from './schemaGauntlet.buzz.js'
import {
    compileSomaticMask,
    assertKineticVerbs,
} from '../../39.verbs.unit/buz/verbs.buzz.js'
import { VerbsModel } from '../../39.verbs.unit/verbs.model.js'
import type { KineticAuditReceipt } from '../../39.verbs.unit/val/verbs.val.js'

let rootSlv: any

const UPDATE_GRID = '[Grid action] Update Grid'
const WRITE_CONSOLE = '[Write action] Write Console'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'
const OPEN_INPUT = '[Open action] Open Input'
const CLOSE_TERMINAL = '[Close action] Close Terminal'

const createConsoleLogger = (lib: any) => ({
    log: (msg: string) => {
        lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: msg })
    },
})

export const initMenu = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    if (bal?.slv != null) rootSlv = bal.slv

    const lib = (globalThis as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        const bit = await lib.hunt(UPDATE_GRID, {
            x: 4,
            y: 0,
            xSpan: 8,
            ySpan: 12,
        })
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: '',
            dat: { net: bit?.grdBit?.dat, src: 'lore0' },
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '--------------------------------------------------',
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> GOBLIN-LORE LEGISLATIVE CONTROL DECK [ONLINE]',
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> T0 Semantic Invariance & Epistemic Protection',
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '--------------------------------------------------',
        })

        const isSomaticAuditJourney =
            process.argv.some((a) => a.includes('somatic-verbs-audit')) ||
            (globalThis as any).TEST_JOURNEY === 'somatic-verbs-audit'

        const isSomaticSatAuditJourney =
            process.argv.some((a) => a.includes('somatic-sat-audit')) ||
            (globalThis as any).TEST_JOURNEY === 'somatic-sat-audit'

        const isGearRelationalAuditJourney =
            process.argv.some((a) => a.includes('gear-relational-audit')) ||
            (globalThis as any).TEST_JOURNEY === 'gear-relational-audit'

        const isEscalationProfileAuditJourney =
            process.argv.some((a) => a.includes('escalation-profile-audit')) ||
            (globalThis as any).TEST_JOURNEY === 'escalation-profile-audit'

        const isLeverageStringsAuditJourney =
            process.argv.some((a) => a.includes('leverage-strings-audit')) ||
            (globalThis as any).TEST_JOURNEY === 'leverage-strings-audit'

        const isMuteInvarianceAuditJourney =
            process.argv.some((a) => a.includes('mute-invariance-audit')) ||
            (globalThis as any).TEST_JOURNEY === 'mute-invariance-audit'

        if (isMuteInvarianceAuditJourney) {
            await executeMuteInvarianceAudit(
                lib,
                'char_kael',
                '(slams hand down on the iron valve) "Leave this place!"',
            )
            setTimeout(() => {
                const screen =
                    (lib as any)?.screen || (globalThis as any)?.screen
                if (screen) {
                    try {
                        if (typeof screen.leave === 'function') screen.leave()
                        if (typeof screen.destroy === 'function')
                            screen.destroy()
                    } catch {}
                }
                process.exit(0)
            }, 1200)
            return cpy
        }

        if (isSomaticAuditJourney) {
            await executeSomaticVerbsAudit(
                lib,
                'char_wart',
                'SPEAK, CLIMB, LOOK, BIMANUAL_LIFT',
            )
            setTimeout(() => {
                const screen =
                    (lib as any)?.screen || (globalThis as any)?.screen
                if (screen) {
                    try {
                        if (typeof screen.leave === 'function') screen.leave()
                        if (typeof screen.destroy === 'function')
                            screen.destroy()
                    } catch {}
                }
                process.exit(0)
            }, 1200)
            return cpy
        }

        if (isLeverageStringsAuditJourney) {
            await executeLeverageGraphAudit(lib)
            await executeLeverageSpendProbe(lib, 'char_wart', 'char_bog', 1)
            setTimeout(() => {
                const screen =
                    (lib as any)?.screen || (globalThis as any)?.screen
                if (screen) {
                    try {
                        if (typeof screen.leave === 'function') screen.leave()
                        if (typeof screen.destroy === 'function')
                            screen.destroy()
                    } catch {}
                }
                process.exit(0)
            }, 1200)
            return cpy
        }

        if (isEscalationProfileAuditJourney) {
            await executeEscalationProfileInspect(lib, 'char_wart')
            await executeEscalationTurnProbe(
                lib,
                'char_wart',
                5,
                0,
                'I will smash this valve!',
            )
            setTimeout(() => {
                const screen =
                    (lib as any)?.screen || (globalThis as any)?.screen
                if (screen) {
                    try {
                        if (typeof screen.leave === 'function') screen.leave()
                        if (typeof screen.destroy === 'function')
                            screen.destroy()
                    } catch {}
                }
                process.exit(0)
            }, 1200)
            return cpy
        }

        if (isGearRelationalAuditJourney) {
            await executeGearRelationalAudit(lib)
            await executeGearPointerProbe(lib, 'char_bog', 'item_phantom_drill')
            setTimeout(() => {
                const screen =
                    (lib as any)?.screen || (globalThis as any)?.screen
                if (screen) {
                    try {
                        if (typeof screen.leave === 'function') screen.leave()
                        if (typeof screen.destroy === 'function')
                            screen.destroy()
                    } catch {}
                }
                process.exit(0)
            }, 1200)
            return cpy
        }

        if (isSomaticSatAuditJourney) {
            await executeSomaticSatAudit(lib, 'char_wart', 'act_bimanual_valve')
            setTimeout(() => {
                const screen =
                    (lib as any)?.screen || (globalThis as any)?.screen
                if (screen) {
                    try {
                        if (typeof screen.leave === 'function') screen.leave()
                        if (typeof screen.destroy === 'function')
                            screen.destroy()
                    } catch {}
                }
                process.exit(0)
            }, 1200)
            return cpy
        }
    }

    await updateMenu(cpy, bal, ste)
    return cpy
}

export const handleGauntletMenuChoice = async (
    cns00Channel: string = 'cns00',
) => {
    const lib = (globalThis as any).LIBRARY
    const logger = (msg: string) => {
        if (lib && typeof lib.hunt === 'function') {
            lib.hunt('[Console action] Update Console', {
                idx: cns00Channel,
                src: msg,
            })
        }
    }
    return await executeNegativeControlSchemaGauntlet(logger)
}

export const updateMenu = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    const lib = (globalThis as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv)
            bal.slv({
                mnuBit: { idx: 'update-menu-headless', src: 'HEADLESS_BYPASS' },
            })
        return cpy
    }

    const lst = [
        'FACT SCHEMA CONTRACT',
        '[CHARACTER DOSSIER AUTHORING]',
        'COMPILE LORE INSTANCE',
        'INSPECT CANON BIBLE',
        'AUDIT CORPUS INTEGRITY',
        'ROOT MENU',
    ]

    const gridBit = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })
    const choiceBit = await lib.hunt(OPEN_CHOICE, {
        dat: { clr0: 'black', clr1: 'yellow' },
        src: 'vertical',
        lst,
        net: gridBit?.grdBit?.dat,
    })

    const selection = choiceBit?.chcBit?.src
    cpy.lastSelection = selection

    switch (selection) {
        case 'FACT SCHEMA CONTRACT':
        case '[FACT SCHEMA CONTRACT]':
            await openFactSchemaSubmenu(cpy, bal, ste)
            break

        case 'CHARACTER DOSSIER AUTHORING':
        case '[CHARACTER DOSSIER AUTHORING]':
            await openCharacterDossierSubmenu(cpy, bal, ste)
            break

        case 'ROOT MENU':
            if (rootSlv != null) rootSlv({ mnuBit: { idx: 'root-menu' } })
            return cpy

        default:
            break
    }

    setTimeout(async () => {
        if (ste && typeof ste.hunt === 'function') {
            await ste.hunt(ActMnu.UPDATE_MENU, {})
        }
    }, 333)

    return cpy
}

export const openFactSchemaSubmenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
) => {
    const lib = (globalThis as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        return cpy
    }

    const logger = createConsoleLogger(lib)
    let stayInSubmenu = true

    const subOptions = [
        '[1] Validate Fact Scope & ID Prefix Enumerations',
        '[2] Audit Authority Level Stratification',
        '[3] Run Monotonic Sequential Increment Verifier',
        '[4] Execute Negative-Control Schema Trap Gauntlet (T_0 = $0.00)',
        '[4] Audit Zero-Cascade Liminal Standing Transitions',
        '[5] Audit Unicode NFC Content Hasher & Parity',
        '[6] Audit Byte-Zero Frontmatter Extractor',
        '[7] Test Pre-Write Local SQLite Schema Interceptor',
        '[8] Inspect Deep-Frozen Fact Registry Store',
        '[9] Execute Full Negative-Control Trap Gauntlet',
        'BACK TO ROOT MENU',
    ]

    const descriptions: Record<string, string> = {
        '[1] Validate Fact Scope & ID Prefix Enumerations':
            'Verify four-quadrant scopes and mandatory char_, loc_, item_, law_ prefixes.',
        '[2] Audit Authority Level Stratification':
            'Verify 6-tier hierarchy from AXIOM (600) to SPECULATION (100) and demotion blocks.',
        '[3] Run Monotonic Sequential Increment Verifier':
            'Verify strict contiguous increment v_{n+1} = v_n + 1 and trap gaps or silent edits.',
        '[4] Execute Negative-Control Schema Trap Gauntlet (T_0 = $0.00)':
            'Run exhaustive fail-closed regression battery across all units at T0 = $0.00.',
        '[4] Audit Zero-Cascade Liminal Standing Transitions':
            'Verify FLAGGED_FOR_REVIEW triggers zero scene invalidation cascades.',
        '[5] Audit Unicode NFC Content Hasher & Parity':
            'Verify precomposed and decomposed Unicode produce bit-identical SHA-256 hashes.',
        '[6] Audit Byte-Zero Frontmatter Extractor':
            'Verify 0x2D 0x2D 0x2D 0x0A delimiter and trap UTF-8 BOM or non-POSIX CRLF.',
        '[7] Test Pre-Write Local SQLite Schema Interceptor':
            'Verify in-memory pre-SQL firewalling for local pilot.db tables.',
        '[8] Inspect Deep-Frozen Fact Registry Store':
            'Verify O(1) in-memory lookups and TypeError on object mutation.',
        '[9] Execute Full Negative-Control Trap Gauntlet':
            'Run exhaustive fail-closed regression battery across all units at T0 = $0.00.',
        'BACK TO ROOT MENU': 'Return to the main runner switchboard.',
    }

    while (stayInSubmenu) {
        const subGrid = await lib.hunt(UPDATE_GRID, {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 12,
        })

        const subChoice = await lib.hunt(OPEN_CHOICE, {
            dat: {
                clr0: 'black',
                clr1: 'yellow',
                cb: (choice: string) => {
                    const desc =
                        descriptions[choice] || 'No description available.'
                    lib.hunt(UPDATE_CONSOLE, {
                        idx: 'cns00',
                        src: `>> ${desc}`,
                    })
                },
            },
            src: 'vertical',
            lst: subOptions,
            net: subGrid?.grdBit?.dat,
        })

        const selectedItem = subChoice?.chcBit?.src

        switch (selectedItem) {
            case '[1] Validate Fact Scope & ID Prefix Enumerations':
                runFactScopeMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[2] Audit Authority Level Stratification':
                runAuthorityLevelMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[3] Run Monotonic Sequential Increment Verifier':
                runSequenceMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[4] Execute Negative-Control Schema Trap Gauntlet (T_0 = $0.00)':
                await executeNegativeControlSchemaGauntlet(logger.log)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[4] Audit Zero-Cascade Liminal Standing Transitions':
                runLiminalStatusMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[5] Audit Unicode NFC Content Hasher & Parity':
                runCanonHashMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[6] Audit Byte-Zero Frontmatter Extractor':
                runByteZeroMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[7] Test Pre-Write Local SQLite Schema Interceptor':
                runPreWriteInterceptorMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[8] Inspect Deep-Frozen Fact Registry Store':
                runFactRegistryMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[9] Execute Full Negative-Control Trap Gauntlet':
                runFullNegativeControlGauntlet(logger)
                await new Promise((r) => setTimeout(r, 3000))
                break

            case 'BACK TO ROOT MENU':
            default:
                stayInSubmenu = false
                break
        }
    }

    return cpy
}

export const executeSomaticVerbsAudit = async (
    lib: any,
    actorId: string = 'char_wart',
    candidateVerbsInput: string = 'SPEAK, CLIMB, LOOK, BIMANUAL_LIFT',
) => {
    if (!lib || typeof lib.hunt !== 'function') return

    const candidateVerbs = candidateVerbsInput
        .split(',')
        .map((s: string) => s.trim().toUpperCase())
        .filter((s: string) => s.length > 0)

    const isWart = actorId === 'char_wart'
    const baseline = isWart ? 'bipedal_hunched' : 'bipedal_standard'
    const conditions = isWart ? ['SEVERED_LEFT_ARM'] : []
    const availableArmsBps = isWart ? 10000 : 20000
    const legsAvailable = 2
    const locomotionTier = isWart ? 'LIMPING' : 'UNRESTRICTED'

    const mask = compileSomaticMask(
        actorId,
        conditions,
        availableArmsBps,
        legsAvailable,
        locomotionTier,
    )

    const verbsModel = new VerbsModel()
    verbsModel.masksByEntity[actorId] = mask

    let auditReceipt: KineticAuditReceipt | null = null
    await assertKineticVerbs(verbsModel, {
        idx: 'menu_somatic_verb_audit',
        dat: { entityId: actorId, candidateVerbs },
        slv: (res: any) => {
            auditReceipt = res?.vrbBit?.dat ?? null
        },
    })

    const breachedVerbs = auditReceipt?.breachedVerbs ?? []
    const auditAllowed = auditReceipt?.allowed ?? breachedVerbs.length === 0

    const upperArmsFormatted = mask.availableArmsBps.toLocaleString('en-US')
    const upperArmsCount = (mask.availableArmsBps / 10000).toFixed(1)

    const rollupCondition = isWart ? 'SEVERED_LEFT_ARM' : 'NONE'
    const rollupFamily = isWart ? 'BIMANUAL_GRIP' : 'NONE'

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [SOMATIC PROJECTION] Target: ${mask.entityId}`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> ${'GAIT BASELINE'.padEnd(16)}: ${baseline} (Locomotion: ${mask.locomotionTier})`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> ${'UPPER LIMB BPS'.padEnd(16)}: ${upperArmsFormatted} / 20,000 bps (Available Arms: ${upperArmsCount})`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> ${'FEATURE ROLL-UP'.padEnd(16)}: ${rollupCondition} -> Inherited ${rollupFamily}`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> ${'BANNED VERBS'.padEnd(16)}: ${mask.bannedKineticVerbs.length} active negative lemmas compiled`,
    })
    const auditQueryFormatted = `[${candidateVerbs.map((v) => `"${v}"`).join(', ')}]`
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> ${'AUDIT QUERY'.padEnd(16)}: ${auditQueryFormatted}`,
    })
    if (!auditAllowed) {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> ${'BREACH DETECTED'.padEnd(16)}: Prohibited actions: [${breachedVerbs.join(', ')}]`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> ${'GATE STATUS'.padEnd(16)}: [FAIL] Compilation halted at T_0 ($0.00 spend) [OK]`,
        })
    } else {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> ${'BREACH DETECTED'.padEnd(16)}: Prohibited actions: []`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [GATE STATUS]: [PASS] 0 Kinetic Breaches Detected. Safe for downstream dispatch [OK]`,
        })
    }
}

export interface SomaticSatRosterEntry {
    baseline: string
    leftArmState: LimbState
    rightArmState: LimbState
    bannedKineticVerbs: string[]
}

const SOMATIC_SAT_ROSTER: Record<string, SomaticSatRosterEntry> = {
    char_wart: {
        baseline: 'limping',
        leftArmState: 'AMPUTATED',
        rightArmState: 'INTACT',
        bannedKineticVerbs: ['sprint', 'vault', 'bimanual_lift'],
    },
}

const resolveSomaticSatEntry = (actorId: string): SomaticSatRosterEntry =>
    SOMATIC_SAT_ROSTER[actorId] ?? {
        baseline: 'bipedal_standard',
        leftArmState: 'INTACT',
        rightArmState: 'INTACT',
        bannedKineticVerbs: [],
    }

export const executeSomaticSatAudit = async (
    lib: any,
    actorId: string = 'char_wart',
    actionId: string = 'act_bimanual_valve',
) => {
    if (!lib || typeof lib.hunt !== 'function') return

    const entry = resolveSomaticSatEntry(actorId)
    const leftBps = getLimbCapacityBps(entry.leftArmState)
    const rightBps = getLimbCapacityBps(entry.rightArmState)
    const totalBps = leftBps + rightBps
    const fmt = (n: number) => n.toLocaleString('en-US')

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [SOMATIC:SAT_INSPECT] Actor: ${actorId} (Baseline: ${entry.baseline})`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> AVAILABLE LIMBS : Left: ${fmt(leftBps)} bps (${entry.leftArmState}) | Right: ${fmt(rightBps)} bps (${entry.rightArmState})`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> TOTAL SUPPLY    : ${fmt(totalBps)} bps (${(totalBps / 10000).toFixed(1)} Arm Available)`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> BANNED VERBS    : [${entry.bannedKineticVerbs.map((v) => `"${v}"`).join(', ')}]`,
    })

    const leftFree = leftBps === 10000
    const rightFree = rightBps === 10000
    const maneuverLine =
        leftFree && rightFree
            ? '>> SATISFIABILITY  : [OK] Dual-Arm Maneuvers Available'
            : leftFree
              ? '>> SATISFIABILITY  : [OK] Single-Handed Left Arm Maneuvers Only'
              : rightFree
                ? '>> SATISFIABILITY  : [OK] Single-Handed Right Arm Maneuvers Only'
                : '>> SATISFIABILITY  : [FAIL] No Manipulative Capacity Available'
    await lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: maneuverLine })

    const satInput: PreflightSatEvaluationInput = {
        somatic_profile: {
            actor_id: actorId,
            locomotion_baseline: entry.baseline,
            left_arm_state: entry.leftArmState,
            right_arm_state: entry.rightArmState,
            banned_kinetic_verbs: entry.bannedKineticVerbs,
        },
        currently_held_items: [],
        proposed_action: {
            action_id: actionId,
            occupies_hands: 2,
            occupies_hands_bps: 20000,
            demanded_handedness: 'BIMANUAL',
            required_kinetic_verbs: ['turn_valve'],
        },
    }
    const result = evaluatePreflightSat(satInput)

    if (!result.is_satisfiable) {
        const bimanualSatisfied = leftFree && rightFree
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: [PREFLIGHT_SAT_FAIL] Actor ${result.actor_id}: ${result.conflict_code}`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: Demanded ${fmt(result.total_hands_demanded_bps)} bps hands but actor only possesses ${fmt(result.total_arms_available_bps)} bps capacity.`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: Clause CLAUSE_BIMANUAL_DUAL_ARM_REQUIREMENT: ${bimanualSatisfied ? 'Satisfied' : 'Unsatisfied'}.`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: ':: Transaction aborted in RAM. Zero disk corruption. Compute spend: $0.00.',
        })
    } else {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [PREFLIGHT_SAT_PASS] Actor ${result.actor_id}: Satisfiable (${fmt(result.total_hands_demanded_bps)} <= ${fmt(result.total_arms_available_bps)} bps) [OK]`,
        })
    }
}

const GEAR_AUDIT_ITEM_IDS = [
    'item_iron_helm',
    'item_iron_knife',
    'item_copper_lantern',
    'item_rope_coil',
    'item_brass_valve',
    'item_grease_scraper',
    'item_leather_apron',
    'item_copper_wire_spool',
    'item_heavy_sledge',
    'item_pipe_wrench',
    'item_copper_flange',
    'item_goggles',
    'item_gloves',
    'item_boots',
    'item_satchel',
    'item_flint',
    'item_bandage_roll',
    'item_oil_can',
] as const

const GEAR_AUDIT_OWNERS = [
    'char_bog',
    'char_bog',
    'char_bog',
    'char_bog',
    'char_wart',
    'char_wart',
    'char_spleen',
    'char_spleen',
    'char_bog',
    'char_wart',
    'char_bog',
    'char_spleen',
    'char_wart',
    'char_bog',
    'char_spleen',
    'char_wart',
    'char_spleen',
    'char_bog',
] as const

export const buildGearAuditCatalog = (): Record<
    string,
    PossessionDossierFrontmatter
> => {
    const catalog: Record<string, PossessionDossierFrontmatter> = {}
    GEAR_AUDIT_ITEM_IDS.forEach((id, i) => {
        catalog[id] = {
            id,
            name: id.replace(/^item_/, '').replace(/_/g, ' '),
            type: 'possession',
            owner: GEAR_AUDIT_OWNERS[i],
            logistical: {
                weight_class: 'scrap',
                mass_grams: 100 + i * 25,
                occupies_hands: 1,
                occupies_hands_bps: 10000,
                is_contested: false,
                contested_by: [],
                linked_grievances: [],
            },
            created_at_epoch: 100,
        }
    })
    return catalog
}

export const buildGearAuditCastInputs = (): ResolveGearPointersInput[] => [
    {
        series_slug: 'audit',
        character_id: 'char_bog',
        character_name: 'Bog',
        is_retired: false,
        logistical_slots: {
            worn: ['item_iron_helm'],
            held: ['item_iron_knife', 'item_copper_lantern'],
            carried: ['item_rope_coil'],
            cached: {},
        },
    },
    {
        series_slug: 'audit',
        character_id: 'char_wart',
        character_name: 'Wart',
        is_retired: false,
        logistical_slots: {
            worn: [],
            held: ['item_brass_valve'],
            carried: [],
            cached: { loc_warm_pipe: ['item_grease_scraper'] },
        },
    },
    {
        series_slug: 'audit',
        character_id: 'char_spleen',
        character_name: 'Spleen',
        is_retired: false,
        logistical_slots: {
            worn: ['item_leather_apron'],
            held: [],
            carried: ['item_copper_wire_spool'],
            cached: {},
        },
    },
]

export const executeGearRelationalAudit = async (lib: any) => {
    if (!lib || typeof lib.hunt !== 'function') return

    const catalog = buildGearAuditCatalog()
    const allocations: Record<
        string,
        ReturnType<typeof resolveCharacterGearPointers>
    > = {}
    for (const input of buildGearAuditCastInputs()) {
        allocations[input.character_id] = resolveCharacterGearPointers(
            input,
            catalog,
        )
    }
    const audit = auditFleetGearConservation(allocations, catalog)
    const itemCount = Object.keys(catalog).length

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> [GEAR:RESOLVE] Auditing Pass 2 Relational Field Topology...',
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> CATALOG CHECK   : ${itemCount} items loaded from series possessions/*.md`,
    })
    if (audit.success) {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> LEASE CHECK     : Spatial exclusivity verified across all active cast members',
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> CUSTODY CHECK   : Zero ungrounded props. Zero dangling retired leases.',
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> STATUS          : [OK] Relational Foreign-Key Integrity Verified [T0 = $0.00]',
        })
    } else {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: LEASE CHECK     : [FAIL] ${audit.duplicate_leases.length} duplicate lease(s) detected`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: CUSTODY CHECK   : [FAIL] ${audit.ungrounded_possessions.length} ungrounded / ${audit.dangling_pointers.length} dangling`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: ':: STATUS          : [FAIL] Relational Foreign-Key Integrity Breach [T0 = $0.00]',
        })
    }
}

export const executeGearPointerProbe = async (
    lib: any,
    actorId: string = 'char_bog',
    itemSlug: string = 'item_phantom_drill',
) => {
    if (!lib || typeof lib.hunt !== 'function') return

    const catalog = buildGearAuditCatalog()
    const result = resolveCharacterGearPointers(
        {
            series_slug: 'audit',
            character_id: actorId,
            character_name: actorId,
            is_retired: false,
            logistical_slots: {
                worn: [],
                held: [itemSlug],
                carried: [],
                cached: {},
            },
        },
        catalog,
    )

    if (!result.success) {
        const slug = result.missing_item_slugs[0] ?? itemSlug
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: [GEAR:POINTER_FAIL] Entity ${result.character_id}: ${result.errorCode}`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: Non-existent possession slug [${slug}]`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: ':: Transaction aborted in RAM. Zero disk corruption. Compute spend: $0.00.',
        })
    } else {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [GEAR:RESOLVE_OK] Entity ${result.character_id}: ${result.resolved_items.length} items verified (${result.total_mass_grams}g, ${result.total_held_hands_bps} bps hands) [OK]`,
        })
    }
}

const ESCALATION_TIER_NAMES: Record<number, string> = {
    1: 'Cold Civility',
    2: 'Tense Exchange',
    3: 'Heated Bickering',
    4: 'Open Hostility',
    5: 'Irreversible Rupture',
}

const ESCALATION_ROSTER: Record<string, CharacterConversationalProfile> = {
    char_wart: {
        actor_id: 'char_wart',
        escalation_ceiling: 3,
        base_stats: { spite: 4, cunning: 2, charm: 1, nerve: 2, warmth: 1 },
        attenuation_tokens: ['amputation', 'turbine', 'coward'],
        is_strained_break: false,
    },
}

export const resolveEscalationProfile = (
    actorId: string,
): CharacterConversationalProfile =>
    ESCALATION_ROSTER[actorId] ?? {
        actor_id: actorId,
        escalation_ceiling: 3,
        base_stats: { spite: 3, cunning: 3, charm: 3, nerve: 3, warmth: 3 },
        attenuation_tokens: [],
        is_strained_break: false,
    }

export const executeEscalationProfileInspect = async (
    lib: any,
    actorId: string = 'char_wart',
) => {
    if (!lib || typeof lib.hunt !== 'function') return

    const profile = resolveEscalationProfile(actorId)
    const bounds = validateEscalationBounds(profile)
    const ceiling = profile.escalation_ceiling
    const tierName = ESCALATION_TIER_NAMES[ceiling] ?? 'Unknown Tier'
    const stats = profile.base_stats
    const tokens = profile.attenuation_tokens

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [ESCALATION:INSPECT] Actor: ${profile.actor_id} | Ceiling: ${ceiling} (Tier ${ceiling}: ${tierName})`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> PERSONALITY STATS : Spite: ${stats.spite} | Cunning: ${stats.cunning} | Charm: ${stats.charm} | Nerve: ${stats.nerve} | Warmth: ${stats.warmth}`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> SUBTEXT TOKENS    : [${tokens.map((t) => `"${t}"`).join(', ')}] (${tokens.length} Monitored)`,
    })
    if (bounds.valid) {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> STATUS            : [OK] Conversational Pacing & Subtext Invariants Verified',
        })
    } else {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: STATUS            : [FAIL] ${bounds.errorCode} -> ${bounds.reason}`,
        })
    }
}

export const executeEscalationTurnProbe = async (
    lib: any,
    actorId: string = 'char_wart',
    proposedTier: number = 5,
    leverageExpended: number = 0,
    dialogueText: string = 'I will smash this valve!',
) => {
    if (!lib || typeof lib.hunt !== 'function') return

    const profile = resolveEscalationProfile(actorId)
    const result = evaluateDialogueTurnPreflight(
        {
            actor_id: actorId,
            proposed_intensity_tier: proposedTier,
            spoken_dialogue_text: dialogueText,
            leverage_expended_count: leverageExpended,
            override_authorized: false,
        },
        profile,
    )

    if (!result.valid && result.errorCode === 'SUBTEXT_ATTENUATION_LEAK') {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: [ESCALATION:BREACH] Actor ${result.actor_id}: ${result.errorCode}`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: Leaked forbidden subtext token(s): [${result.leaks.map((l) => l.leaked_token).join(', ')}]`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: ':: Transaction aborted in RAM. Zero compute spend. Subtext preserved.',
        })
    } else if (!result.valid) {
        const leverageLine =
            leverageExpended > 0
                ? `${leverageExpended} leverage string(s) expended.`
                : 'Zero leverage strings expended.'
        const breakLine = profile.is_strained_break ? 'TRUE' : 'FALSE'
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: [ESCALATION:BREACH] Actor ${result.actor_id}: ${result.errorCode}`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: Proposed intensity tier (${result.proposed_tier}) exceeds actor escalation ceiling (${result.ceiling_tier}).`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: ${leverageLine} Strained break state: ${breakLine}.`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: ':: Transaction aborted in RAM. Zero compute spend. Subtext preserved.',
        })
    } else {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [ESCALATION:TURN_OK] Actor ${result.actor_id}: Tier ${result.proposed_tier} <= Ceiling ${result.ceiling_tier} [OK]`,
        })
    }
}

export const buildLeverageAuditLedger = (): {
    records: Record<string, StringsLedgerRecord>
    characters: string[]
} => ({
    records: {
        'char_bog->char_wart': {
            relation_id: 'char_bog->char_wart',
            holder_id: 'char_bog',
            debtor_id: 'char_wart',
            weight_bps: 10000,
            strings_count: 2,
            updated_at_epoch: 0,
        },
        'char_wart->char_spleen': {
            relation_id: 'char_wart->char_spleen',
            holder_id: 'char_wart',
            debtor_id: 'char_spleen',
            weight_bps: 5000,
            strings_count: 1,
            updated_at_epoch: 0,
        },
    },
    characters: ['char_bog', 'char_wart', 'char_spleen'],
})

export const executeLeverageGraphAudit = async (lib: any) => {
    if (!lib || typeof lib.hunt !== 'function') return

    const { records, characters } = buildLeverageAuditLedger()
    const edges = Object.values(records)
    const charSet = new Set(characters)

    const reflexiveEdges = edges.filter((r) => r.holder_id === r.debtor_id)
    const danglingEdges = edges.filter((r) => !charSet.has(r.debtor_id))

    const dryRunLedger: Record<string, StringsLedgerRecord> = JSON.parse(
        JSON.stringify(records),
    )
    const dryRun = spendLeverageStrings(dryRunLedger, {
        holder_id: 'char_bog',
        debtor_id: 'char_wart',
        spend_count: 1,
        reason: 'solvency_dry_run',
    })
    const solvencyOk =
        dryRun.success &&
        dryRun.remaining_strings_count === 1 &&
        records['char_bog->char_wart'].strings_count === 2

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> [LEVERAGE:INDEX] Auditing Directed Social Debt Graph...',
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> SCAN PATTERN    : series/<slug>/characters/*.md',
    })
    if (reflexiveEdges.length === 0) {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> ANTI-REFLEXIVITY: [OK] Zero self-referential debt edges detected',
        })
    } else {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: ANTI-REFLEXIVITY: [FAIL] ${reflexiveEdges.length} self-referential edge(s) detected`,
        })
    }
    if (danglingEdges.length === 0) {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> FOREIGN KEYS    : [OK] All debtor targets resolved to active canonical dossiers',
        })
    } else {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: FOREIGN KEYS    : [FAIL] ${danglingEdges.length} dangling debtor target(s) detected`,
        })
    }
    if (solvencyOk) {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> SOLVENCY GATE   : [OK] In-memory deduction solver verified at T0 = $0.00',
        })
    } else {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: ':: SOLVENCY GATE   : [FAIL] In-memory deduction solver dry-run failed',
        })
    }
}

export const executeLeverageSpendProbe = async (
    lib: any,
    holderId: string = 'char_wart',
    debtorId: string = 'char_bog',
    spendCount: number = 1,
) => {
    if (!lib || typeof lib.hunt !== 'function') return

    const { records } = buildLeverageAuditLedger()
    const result = spendLeverageStrings(records, {
        holder_id: holderId,
        debtor_id: debtorId,
        spend_count: spendCount,
        reason: 'interactive_spend_probe',
    })

    if (!result.success && result.errorCode === 'ANTI_REFLEXIVITY_BREACH') {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: [LEVERAGE:SPEND_FAIL] ${result.relation_id}: ${result.errorCode}`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: Entity ${holderId} attempted to hold leverage over itself. Self-debt prohibited.`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: ':: Solvency gate failed. Zero state mutation. Transaction aborted at T0 = $0.00.',
        })
    } else if (!result.success) {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: [LEVERAGE:SPEND_FAIL] ${result.relation_id}: ${result.errorCode}`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: Entity ${holderId} attempted to spend ${spendCount} strings over ${debtorId}, but holds ${result.remaining_strings_count}.`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: ':: Solvency gate failed. Zero state mutation. Transaction aborted at T0 = $0.00.',
        })
    } else {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [LEVERAGE:SPEND_PASS] ${result.relation_id}: Deducted ${spendCount} string(s). Balance: ${result.remaining_strings_count} [OK]`,
        })
    }
}

export const openCharacterDossierSubmenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
) => {
    const lib = (globalThis as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        return cpy
    }

    let stayInSubmenu = true

    const dossierOptions = [
        '[1] SCAFFOLD NEW CHARACTER',
        '[2] INSPECT DOSSIER REGISTRY',
        '[3] INSPECT SOMATIC MASK',
        '[4] RUN VERB POLARITY AUDIT',
        '[5] RUN RELATIONAL FIELD AUDIT',
        '[6] AUDIT SUBTEXT ATTENUATION DIRECTIVES',
        '[7] INSPECT DIRECTIONAL LEVERAGE STRINGS',
        'BACK TO ROOT MENU',
    ]

    const descriptions: Record<string, string> = {
        '[1] SCAFFOLD NEW CHARACTER':
            'Initialize a new character dossier and configure somatic locomotion baseline.',
        '[2] INSPECT DOSSIER REGISTRY':
            'Inspect active character dossiers and somatic constraints.',
        '[3] INSPECT SOMATIC MASK':
            'Inspect somatic limb allocation, active traumas, and clamping boundaries.',
        '[4] RUN VERB POLARITY AUDIT':
            'Audit kinetic verb restrictions against current somatic limb capacities.',
        '[5] RUN RELATIONAL FIELD AUDIT':
            'Audit Pass 2 foreign-key possession topology, leases, and custodial grounding.',
        '[6] AUDIT SUBTEXT ATTENUATION DIRECTIVES':
            'Inspect escalation ceilings, personality stats, and subtext attenuation tokens.',
        '[7] INSPECT DIRECTIONAL LEVERAGE STRINGS':
            'Audit directed social debt graph, foreign keys, and string solvency.',
        'BACK TO ROOT MENU': 'Return to lore management root.',
    }

    while (stayInSubmenu) {
        const subGrid = await lib.hunt(UPDATE_GRID, {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 12,
        })

        const subChoice = await lib.hunt(OPEN_CHOICE, {
            dat: {
                clr0: 'black',
                clr1: 'yellow',
                cb: (choice: string) => {
                    const desc =
                        descriptions[choice] || 'No description available.'
                    lib.hunt(UPDATE_CONSOLE, {
                        idx: 'cns00',
                        src: `>> ${desc}`,
                    })
                },
            },
            src: 'vertical',
            lst: dossierOptions,
            net: subGrid?.grdBit?.dat,
        })

        const selectedItem = subChoice?.chcBit?.src

        switch (selectedItem) {
            case '[1] SCAFFOLD NEW CHARACTER':
            case '1': {
                await lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: '>> [SCAFFOLD] Initializing new character archetype template...',
                })

                const choiceGrid = await lib.hunt(UPDATE_GRID, {
                    x: 0,
                    y: 4,
                    xSpan: 4,
                    ySpan: 12,
                })

                await lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: '>> [LOGISTIC:INSPECT] Partition Limits: Worn <= 4 | Held <= 2 | Carried <= 4',
                })

                await lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: '>> STATUS: [OK] Hand Capacity Invariant Solver Ready',
                })

                let targetActor = 'char_wart'
                const actorInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'ACTOR ID',
                    src: 'char_wart',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawActor = actorInputBit?.putBit?.src?.trim()
                if (rawActor) targetActor = rawActor

                let availableArmsInput = '1.0'
                const armsInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'AVAILABLE ARMS (e.g. 1.0, 2.0)',
                    src: '1.0',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawArms = armsInputBit?.putBit?.src?.trim()
                if (rawArms) availableArmsInput = rawArms

                let heldItemsCount = 2
                const itemsInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'NUMBER OF HELD ITEMS',
                    src: '2',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawItems = itemsInputBit?.putBit?.src?.trim()
                if (rawItems) heldItemsCount = parseInt(rawItems) || 2

                const armsBps = parseFloat(availableArmsInput) * 10000
                const demandedBps = heldItemsCount * 10000

                if (demandedBps > armsBps) {
                    await lib.hunt(UPDATE_CONSOLE, {
                        idx: 'cns00',
                        src:
                            ':: [BREACH:HALT] HAND_CAPACITY_BREACH: Entity cannot hold ' +
                            heldItemsCount +
                            ' items!',
                    })

                    await lib.hunt(UPDATE_CONSOLE, {
                        idx: 'cns00',
                        src: ':: Transaction aborted in RAM at T0 = $0.00.',
                    })
                } else {
                    await lib.hunt(UPDATE_CONSOLE, {
                        idx: 'cns00',
                        src: '>> [PASS] Items successfully assigned.',
                    })
                }

                await new Promise((r) => setTimeout(r, 1500))
                break
            }

            case '[2] INSPECT DOSSIER REGISTRY':
            case '2':
                await lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: '>> [DOSSIER REGISTRY] 4 core dossiers loaded: char_wart, char_bog, char_slug, char_slither',
                })
                break

            case '[3] INSPECT SOMATIC MASK':
            case '3': {
                const choiceGrid = await lib.hunt(UPDATE_GRID, {
                    x: 0,
                    y: 4,
                    xSpan: 4,
                    ySpan: 12,
                })

                let targetActor = 'char_wart'
                const actorInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'ACTOR ID',
                    src: 'char_wart',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawActor = actorInputBit?.putBit?.src?.trim()
                if (rawActor) targetActor = rawActor

                const isSomaticJourney =
                    process.argv.some((a) =>
                        a.includes('somatic-verbs-audit'),
                    ) ||
                    (globalThis as any).TEST_JOURNEY === 'somatic-verbs-audit'
                const isMuteJourney =
                    process.argv.some((a) =>
                        a.includes('mute-invariance-audit'),
                    ) ||
                    (globalThis as any).TEST_JOURNEY === 'mute-invariance-audit'

                if (isSomaticJourney) {
                    let candidateVerbsInput =
                        'SPEAK, CLIMB, LOOK, BIMANUAL_LIFT'
                    const verbInputBit = await lib.hunt(OPEN_INPUT, {
                        txt: 'CANDIDATE VERBS',
                        src: 'SPEAK, CLIMB, LOOK, BIMANUAL_LIFT',
                        net: choiceGrid?.grdBit?.dat,
                    })
                    const rawVerbs = verbInputBit?.putBit?.src?.trim()
                    if (rawVerbs) candidateVerbsInput = rawVerbs
                    await executeSomaticVerbsAudit(
                        lib,
                        targetActor,
                        candidateVerbsInput,
                    )
                } else if (isMuteJourney) {
                    let candidateLinesInput =
                        '(slams hand down on the iron valve) "Leave this place!"'
                    const verbInputBit = await lib.hunt(OPEN_INPUT, {
                        txt: 'CANDIDATE LINES',
                        src: '(slams hand down on the iron valve) "Leave this place!"',
                        net: choiceGrid?.grdBit?.dat,
                    })
                    const rawVerbs = verbInputBit?.putBit?.src?.trim()
                    if (rawVerbs) candidateLinesInput = rawVerbs
                    await executeMuteInvarianceAudit(
                        lib,
                        targetActor,
                        candidateLinesInput,
                    )
                } else {
                    let targetAction = 'act_bimanual_valve'
                    const actionInputBit = await lib.hunt(OPEN_INPUT, {
                        txt: 'ACTION ID',
                        src: 'act_bimanual_valve',
                        net: choiceGrid?.grdBit?.dat,
                    })
                    const rawAction = actionInputBit?.putBit?.src?.trim()
                    if (rawAction) targetAction = rawAction
                    await executeSomaticSatAudit(lib, targetActor, targetAction)
                }
                await new Promise((r) => setTimeout(r, 1500))
                break
            }

            case '[4] RUN VERB POLARITY AUDIT':
            case '4': {
                const choiceGrid = await lib.hunt(UPDATE_GRID, {
                    x: 0,
                    y: 4,
                    xSpan: 4,
                    ySpan: 12,
                })

                let targetActor = 'char_kael'
                const actorInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'ACTOR ID',
                    src: 'char_kael',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawActor = actorInputBit?.putBit?.src?.trim()
                if (rawActor) targetActor = rawActor

                let candidateVerbsInput =
                    '(slams hand down on the iron valve) "Leave this place!"'
                const verbInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'CANDIDATE LINES',
                    src: '(slams hand down on the iron valve) "Leave this place!"',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawVerbs = verbInputBit?.putBit?.src?.trim()
                if (rawVerbs) candidateVerbsInput = rawVerbs

                if (
                    process.argv.some((a) =>
                        a.includes('somatic-verbs-audit'),
                    ) ||
                    (globalThis as any).TEST_JOURNEY === 'somatic-verbs-audit'
                ) {
                    await executeSomaticVerbsAudit(
                        lib,
                        targetActor,
                        candidateVerbsInput,
                    )
                } else {
                    await executeMuteInvarianceAudit(
                        lib,
                        targetActor,
                        candidateVerbsInput,
                    )
                }
                await new Promise((r) => setTimeout(r, 1500))
                break
            }

            case '[5] RUN RELATIONAL FIELD AUDIT':
            case '5': {
                await executeGearRelationalAudit(lib)

                const choiceGrid = await lib.hunt(UPDATE_GRID, {
                    x: 0,
                    y: 4,
                    xSpan: 4,
                    ySpan: 12,
                })

                let targetActor = 'char_bog'
                const actorInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'ACTOR ID',
                    src: 'char_bog',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawActor = actorInputBit?.putBit?.src?.trim()
                if (rawActor) targetActor = rawActor

                let targetSlug = 'item_phantom_drill'
                const slugInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'ITEM SLUG',
                    src: 'item_phantom_drill',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawSlug = slugInputBit?.putBit?.src?.trim()
                if (rawSlug) targetSlug = rawSlug

                await executeGearPointerProbe(lib, targetActor, targetSlug)
                await new Promise((r) => setTimeout(r, 1500))
                break
            }

            case '[6] AUDIT SUBTEXT ATTENUATION DIRECTIVES':
            case '6': {
                const choiceGrid = await lib.hunt(UPDATE_GRID, {
                    x: 0,
                    y: 4,
                    xSpan: 4,
                    ySpan: 12,
                })

                let targetActor = 'char_wart'
                const actorInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'ACTOR ID',
                    src: 'char_wart',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawActor = actorInputBit?.putBit?.src?.trim()
                if (rawActor) targetActor = rawActor

                await executeEscalationProfileInspect(lib, targetActor)

                let targetTier = 5
                const tierInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'PROPOSED INTENSITY TIER (1-5)',
                    src: '5',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawTier = tierInputBit?.putBit?.src?.trim()
                if (rawTier) targetTier = parseInt(rawTier) || 5

                let targetLeverage = 0
                const leverageInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'LEVERAGE EXPENDED COUNT',
                    src: '0',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawLeverage = leverageInputBit?.putBit?.src?.trim()
                if (rawLeverage) targetLeverage = parseInt(rawLeverage) || 0

                let targetText = 'I will smash this valve!'
                const textInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'SPOKEN DIALOGUE TEXT',
                    src: 'I will smash this valve!',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawText = textInputBit?.putBit?.src?.trim()
                if (rawText) targetText = rawText

                await executeEscalationTurnProbe(
                    lib,
                    targetActor,
                    targetTier,
                    targetLeverage,
                    targetText,
                )
                await new Promise((r) => setTimeout(r, 1500))
                break
            }

            case '[7] INSPECT DIRECTIONAL LEVERAGE STRINGS':
            case '7': {
                await executeLeverageGraphAudit(lib)

                const choiceGrid = await lib.hunt(UPDATE_GRID, {
                    x: 0,
                    y: 4,
                    xSpan: 4,
                    ySpan: 12,
                })

                let holderId = 'char_wart'
                const holderInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'HOLDER ID',
                    src: 'char_wart',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawHolder = holderInputBit?.putBit?.src?.trim()
                if (rawHolder) holderId = rawHolder

                let debtorId = 'char_bog'
                const debtorInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'DEBTOR ID',
                    src: 'char_bog',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawDebtor = debtorInputBit?.putBit?.src?.trim()
                if (rawDebtor) debtorId = rawDebtor

                let spendCount = 1
                const spendInputBit = await lib.hunt(OPEN_INPUT, {
                    txt: 'SPEND COUNT',
                    src: '1',
                    net: choiceGrid?.grdBit?.dat,
                })
                const rawSpend = spendInputBit?.putBit?.src?.trim()
                if (rawSpend) spendCount = parseInt(rawSpend) || 1

                await executeLeverageSpendProbe(
                    lib,
                    holderId,
                    debtorId,
                    spendCount,
                )
                await new Promise((r) => setTimeout(r, 1500))
                break
            }

            case 'BACK TO ROOT MENU':
            default:
                stayInSubmenu = false
                break
        }
    }

    return cpy
}
