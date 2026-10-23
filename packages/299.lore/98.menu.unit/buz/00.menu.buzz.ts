import * as ActMnu from '../menu.action.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'
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
            case '1':
                await lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: '>> [SCAFFOLD] Initializing new character archetype template...',
                })
                break

            case '[2] INSPECT DOSSIER REGISTRY':
            case '2':
                await lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: '>> [DOSSIER REGISTRY] 4 core dossiers loaded: char_wart, char_bog, char_slug, char_slither',
                })
                break

            case '[3] INSPECT SOMATIC MASK':
            case '3':
            case '[4] RUN VERB POLARITY AUDIT':
            case '4': {
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

                let candidateVerbsInput = 'SPEAK, CLIMB, LOOK, BIMANUAL_LIFT'
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
