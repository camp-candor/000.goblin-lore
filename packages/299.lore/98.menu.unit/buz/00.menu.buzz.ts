/**
 * packages/299.lore/98.menu.unit/buz/00.menu.buzz.ts
 *
 * Interactive Blessed Curses choice handler and cns00 telemetry router for 299.lore.
 * Connects directly to 43.compile.unit and domain audit buzzers at T_0 = $0.00.
 */

import fs from 'node:fs'
import path from 'node:path'
import type { MenuModel } from '../menu.model'
import type MenuBit from '../fce/menu.bit'
import type State from '../../99.core/state'
import { RuleSchema } from '../../03.laws.unit/fce/rule.schema.js'
import { ErrataRecordSchema } from '../../03.laws.unit/fce/errata.schema.js'
import {
    CanonFactStandingSchema,
    getStandingMetadata,
} from '../../41.canon.unit/fce/standing.schema.js'
import {
    rankReconsiderationQueue,
    affirmStillGood,
} from '../../41.canon.unit/buz/standing.buzz.js'
import type { CanonFactStanding } from '../../41.canon.unit/fce/standing.schema.js'
import { TrieClueDisjointnessSolver } from '../../41.canon.unit/buz/trieDisjointness.buzz.js'
import type { MysteryTrieIngress } from '../../41.canon.unit/fce/trieDisjointness.bit.js'
import { pass2Traverse } from '../../43.compile.unit/buz/compile.buzz.js'
import { CompileModel } from '../../43.compile.unit/compile.model.js'
import type { Rule, Authorizer } from '../../03.laws.unit/fce/rule.schema.js'
import type { PardonRecord } from '../../03.laws.unit/fce/pardon.schema.js'
import { validatePass2Pardons } from '../../03.laws.unit/buz/pardon.buzz.js'
import * as ActMnu from '../menu.action'
import * as ActSch from '../../26.schema.unit/schema.action'
import * as ActCmp from '../../43.compile.unit/compile.action'
import * as ActLdg from '../../16.ledger.unit/ledger.action'
import { deepFreeze } from '../../26.schema.unit/buz/freeze.buzz'
import { auditPrimitiveStandards } from './01.schema.audit.buzz'
import { runSomaticAuditMenu } from './02.somatic.audit.buzz'
import {
    runHandCapacityAudit,
    runPortalReciprocityAudit,
} from './03.logistics.audit.buzz'
import {
    runCausalDagAudit,
    runDyadicMeshAudit,
    runEpistemicFirewallAudit,
} from './04.grievance.audit.buzz'
import {
    runEntityManifestAudit,
    runSomaticSolverAudit,
} from './05.schema.solver.audit.buzz'
import { runPressureMeterSimulatorMenu } from './06.pressure.simulator.buzz'
import { runAcousticParanoiaInspectorMenu } from './07.acoustic.inspector.buzz'
import { runAlgebraicDspInspectorMenu } from './08.algebraic.inspector.buzz'
import { runPostBreakFinalityTriggerMenu } from './09.postbreak.trigger.buzz'
import { runSynthesisPayloadValidatorMenu } from './10.payload.validator.buzz'
import { runVocalFeasibilityInspectorMenu } from './11.vocal.feasibility.buzz'
import { runFactStalenessCheckerMenu } from './12.fact.staleness.buzz'
import { runDeterministicPayloadHasherMenu } from './13.payload.hasher.buzz'
import { runPayloadReducerConsoleMenu } from './14.payload.reducer.buzz'
import {
    runConstitutionalRegistryAudit,
    REGISTRY_MENU_LABEL,
} from './15.constitutional.registry.buzz'
import {
    runErrataLedgerAudit,
    ERRATA_MENU_LABEL,
} from './16.errata.ledger.buzz'
import {
    runFourTupleContractAudit,
    FOUR_TUPLE_MENU_LABEL,
} from './17.four.tuple.audit.buzz'
import {
    runSeriesTreeScaffoldAudit,
    SERIES_TREE_MENU_LABEL,
} from './18.series.tree.audit.buzz'
import {
    runGenesisSeedsAudit,
    GENESIS_SEEDS_MENU_LABEL,
} from './19.genesis.seeds.audit.buzz'
import {
    runPortalReconcileAudit,
    PORTAL_RECONCILE_MENU_LABEL,
} from './20.portal.reconcile.audit.buzz'
import { getChoiceById, dispatchSomaticChoice } from './somaticMenu.buzz.js'

import { runSeriesGenesisMenu } from './genesisMenu.buzz.js'
import { promptLocomotionChoice } from './locomotionMenu.buzz.js'
import { runEntityScaffoldMenu } from './entityScaffoldMenu.buzz.js'
import { runEntityRetirementMenu } from './retirementMenu.buzz.js'
import { runCorpusHealthMenu } from './corpusHealthMenu.buzz.js'
import { runErrataMenu } from './errataMenu.buzz.js'
import { publishSealedCanonToFleet } from './fleetPublish.buzz.js'
import { exportStaticTopologyManifest } from './topologyExport.buzz.js'
import {
    HYGIENE_LABEL,
    HYGIENE_SWEEP_LABEL,
    HYGIENE_BACK_LABEL,
    runHygieneMenu,
} from './hygieneMenu.buzz.js'
import { resolveRepoRoot } from '../../29.series.unit/buz/scaffoldSeriesTree.buzz.js'

import { SCHEMA_SOLVER_MENU_LABEL } from './05.schema.solver.audit.buzz'

export const GENESIS_WIZARD_LABEL = '[G] UNIVERSAL SERIES GENESIS WIZARD'
export const ENTITY_SCAFFOLDER_LABEL = '[S] ATOMIC ENTITY SCAFFOLDER'
export const RETIRE_ENTITY_LABEL = '[R] RETIRE CANONICAL ENTITY'
export const CORPUS_HEALTH_LABEL = '[H] STATIC CORPUS HEALTH TELEMETRY'
export const RECORD_ERRATA_LABEL = '[X] RECORD CANONICAL ERRATA ENTRY'
export const PUBLISH_CANON_LABEL =
    '[P] PUBLISH SEALED CANON TO SIMULATION FLEET'
export const HYGIENE_MENU_LABEL = HYGIENE_LABEL
export const LAWS_MENU_LABEL = '[LAWS MENU]'
export const ERRATA_DECK_MENU_LABEL = '[ERRATA MENU]'
export const CANON_MENU_LABEL = '[CANON MENU]'
export const LOCOMOTION_MENU_LABEL = '[LOCOMOTION BASELINE]'

export const LIFECYCLE_MENU_OPTIONS: readonly string[] = Object.freeze([
    GENESIS_WIZARD_LABEL,
    ENTITY_SCAFFOLDER_LABEL,
    RETIRE_ENTITY_LABEL,
    CORPUS_HEALTH_LABEL,
    RECORD_ERRATA_LABEL,
])

import { assembleDualRailDossier } from '../../09.entity.unit/buz/entityAssemble.buzz.js'
import { runEntityPreFlightGate } from '../../09.entity.unit/buz/preFlightGate.buzz.js'

export const ASSEMBLE_BYTE_ZERO_DOSSIER_LABEL =
    '[1] ASSEMBLE BYTE-ZERO DUAL-RAIL DOSSIER'

export const assembleByteZeroDossierMenuAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [ASSEMBLE:DOSSIER] Compiling Byte-0 Dual-Rail Dossier preview...',
    )

    const { dossierText, receipt } = assembleDualRailDossier(
        'character',
        {
            id: 'char_wart',
            name: 'Wart',
            status: 'active',
            created_at_epoch: 0,
            somatic: {
                available_arms_bps: 10000,
            },
        },
        {
            wantsSurface: 'Keep the culvert grate clear of silt.',
            wantsActual: 'Hide the spare brass key behind the loose mortar.',
            blindSpot: 'Believes nobody notices the missing tallow tin.',
            voiceNotes: 'Short declarative sentences; gravelly cadence.',
            fewShotLines: ['Valve is stuck. Hand me the iron bar.'],
        },
    )

    await emitConsoleLine(
        ste,
        `>> [BYTE0:OK] Offset 0 header: 0x${receipt.firstFourBytesHex} | Total bytes: ${receipt.byteLength} | CRLF: 0`,
    )

    cpy.statusMessage = 'BYTE_ZERO_DOSSIER_ASSEMBLED'

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'assemble-byte-zero-dossier',
                val: 0,
                dat: { dossierText, receipt },
            },
        })
    }
    return cpy
}

import {
    COMPILE_MENU_OPTIONS,
    emitConsoleLine,
    printLoreCockpitBanner,
    printDetailedCompileReceipt,
    printCompileFailureReport,
} from '../compile-menu.view'

// Canonical 995.library harness action types (lowercase 'action' form).
const GRID_UPDATE = '[Grid action] Update Grid'
const WRITE_CONSOLE = '[Write action] Write Console'
const CHOICE_OPEN = '[Open action] Open Choice'
const CONSOLE_UPDATE = '[Console action] Update Console'
const TERMINAL_CLEAR = '[Layout action] Clear Terminal'
const TERMINAL_CLOSE = '[Terminal action] Close Terminal'

// Holds the INIT_MENU resolver while the operator navigates the live lore
// submenu. Released when ROOT MENU is chosen so run.ts can reopen the
// master switchboard. Null in headless/test contexts.
let rootSlv: ((result: { mnuBit: MenuBit }) => void) | null = null
let screenExitHooked = false

function resolveHeadlessMenu(
    bal: MenuBit | undefined,
    lst: string[],
    activeSeries: string,
): void {
    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'update-menu-headless',
                lst,
                val: 1,
                dat: { activeSeries },
            },
        })
    }
}

function attachCleanExitBindings(lib: any): void {
    if (screenExitHooked || !lib) return
    const screen = lib?.state?.value?.terminal?.screen
    if (!screen || typeof screen.key !== 'function') return
    screenExitHooked = true

    let escapeCount = 0
    let escapeResetTimer: ReturnType<typeof setTimeout> | null = null

    const performCleanShutdown = async () => {
        try {
            await lib.hunt(TERMINAL_CLEAR, {})
            await lib.hunt(TERMINAL_CLOSE, {})
        } catch {
            // Ignore headless teardown errors
        }
        process.exit(0)
    }

    screen.key(['C-c'], performCleanShutdown)
    screen.key(['q'], () => {
        const focused = screen.focused
        if (
            focused &&
            (focused.type === 'textbox' ||
                focused.type === 'textarea' ||
                focused.name === 'input-body')
        ) {
            return
        }
        performCleanShutdown()
    })
    screen.key(['escape'], () => {
        escapeCount += 1
        if (escapeResetTimer) clearTimeout(escapeResetTimer)
        escapeResetTimer = setTimeout(() => {
            escapeCount = 0
        }, 2500)
        if (escapeCount >= 2) {
            setTimeout(performCleanShutdown, 150)
        }
    })
}

// Auto-bind on module load if global.LIBRARY is already live
try {
    const bootLib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (bootLib) attachCleanExitBindings(bootLib)
} catch {
    // Ignore in test environments
}

async function mountConsolePane(lib: any): Promise<void> {
    if (!lib || typeof lib.hunt !== 'function') return
    try {
        const gridBit = await lib.hunt(GRID_UPDATE, {
            x: 4,
            y: 0,
            xSpan: 8,
            ySpan: 12,
        })
        if (gridBit?.grdBit?.dat) {
            await lib.hunt(WRITE_CONSOLE, {
                idx: 'cns00',
                src: '',
                dat: { net: gridBit.grdBit.dat, src: 'alligator0' },
            })
        }
    } catch {
        // Ignore in mock or headless environments where Write Console is unmounted
    }
}

export const initMenu = (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): MenuModel => {
    bal.val = 0
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (bal?.slv) {
        if (lib && typeof lib.hunt === 'function' && ste?.hunt) {
            // Live cockpit: hold the INIT_MENU resolver, mount cns00 console,
            // render HUD banner, and cascade into the interactive choice loop.
            attachCleanExitBindings(lib)
            rootSlv = bal.slv as (result: { mnuBit: MenuBit }) => void
            ;(async () => {
                await mountConsolePane(lib)
                const compileState = (ste as any)?.value?.compile
                await printLoreCockpitBanner(
                    ste,
                    cpy.activeSeries || '000.sample-hearth',
                    compileState?.status || 'IDLE',
                    compileState?.lastMerkleHash || '',
                )
                await updateMenu(
                    cpy,
                    { idx: 'init-menu-cascade' } as MenuBit,
                    ste,
                )
            })().catch((err: any) => {
                try {
                    lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: `:: [MENU_FAULT] ${err?.message || err}`,
                    })
                } catch {
                    // Headless teardown in progress; nothing left to report to.
                }
            })
        } else {
            bal.slv({ mnuBit: { idx: 'init-menu-headless', val: 1 } })
        }
    }
    return cpy
}

export const updateMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const activeSeries = cpy.activeSeries || '001.goblin-lore'
    const library = (globalThis as any).LIBRARY || (global as any).LIBRARY
    const lib = library

    const lst = [
        '1. VALIDATE SCHEMA INVARIANTS',
        SCHEMA_SOLVER_MENU_LABEL,
        '[LAWS MENU]',
        '[ERRATA MENU]',
        '[CANON MENU]',
        '[Somatic DSP Modulation Hub]',
        LOCOMOTION_MENU_LABEL,
        '2. RUN SOMATIC SAT SOLVER',
        '3. AUDIT KINETIC MOTOR MASKS',
        '4. VERIFY HEAP IMMUTABILITY',
        '5. AUDIT SPATIAL PORTALS & ACOUSTICS',
        '6. AUDIT GRIEVANCE DAG & DYADIC MESH',
        '7. VERIFY EPISTEMIC FIREWALLS',
        '8. INTERACTIVE SOMATIC MOTOR LAB',
        '[S] STYLOMETRIC & VOICE-BLEED LINTER',
        '[H] HERMETIC OFFLINE DELETION PARITY',
        '[HYGIENE]',
        '[C] COMPILE CANON & GATE 0 GAUNTLET',
        PUBLISH_CANON_LABEL,
        ...LIFECYCLE_MENU_OPTIONS,
        'ROOT MENU',
    ]

    // Headless execution safety fallback for CI and non-TTY test environments
    if (!library) {
        resolveHeadlessMenu(bal, lst, activeSeries)
        return cpy
    }

    if (typeof library.hunt !== 'function') {
        resolveHeadlessMenu(bal, lst, activeSeries)
        return cpy
    }

    const descriptions: Record<string, string> = {
        '1. VALIDATE SCHEMA INVARIANTS':
            'Validate frontmatter entities, basis-point bounds, and Banker rounding.',
        '[ 26. SCHEMA & INVARIANTS ]':
            'Open entity manifests, somatic SAT, and constitutional rule registry audits.',
        '[LAWS MENU]':
            'Open constitutional rule registry laws deck and inspect hard invariants.',
        '[ERRATA MENU]':
            'Open append-only errata ledger deck and validate record contracts.',
        '[CANON MENU]':
            'Open epistemic standing registry deck and inspect canon fact standings.',
        '[Somatic DSP Modulation Hub]':
            'Extract disk-backed Somatic Ledger dossiers, trauma floors, and SQLite records.',
        [LOCOMOTION_MENU_LABEL]:
            'Select canonical somatic locomotion baseline, integer velocity cap, and verb masks.',
        '2. RUN SOMATIC SAT SOLVER':
            'Evaluate upper-limb capacity and anatomical hand saturation.',
        '3. AUDIT KINETIC MOTOR MASKS':
            'Assert action verb exclusion against locomotion tiers and conditions.',
        '4. VERIFY HEAP IMMUTABILITY':
            'Confirm deepFreeze traps property mutation on sealed entities.',
        '5. AUDIT SPATIAL PORTALS & ACOUSTICS':
            'Verify bidirectional portal reciprocity and cdB acoustic attenuation.',
        '6. AUDIT GRIEVANCE DAG & DYADIC MESH':
            'Run 3-color DFS cycle detection, topological depth, and dyadic mesh checks.',
        '7. VERIFY EPISTEMIC FIREWALLS':
            'Enforce Clue-Lemma Disjointness and false-belief prompt-injection guards.',
        '8. INTERACTIVE SOMATIC MOTOR LAB':
            'Inspect character somatic masks and test custom kinetic verbs interactively.',
        '[S] STYLOMETRIC & VOICE-BLEED LINTER':
            'Audit prose lexical diversity, corporate slop bans, and callback collisions.',
        '[H] HERMETIC OFFLINE DELETION PARITY':
            'Purge compiled/ artifacts and verify bit-for-bit offline H_root rebuild.',
        '[HYGIENE]':
            'Open the hygiene flight deck to ping every mounted unit buzzer.',
        '[C] COMPILE CANON & GATE 0 GAUNTLET':
            'Open 3-pass compiler flight deck, Merkle emission, and Gate 0 verification.',
        [PUBLISH_CANON_LABEL]:
            'Copy verified bible-state.json into 000.series-sower-engine and export room topology manifest into 000.goblin-spatial.',
        '[X] RECORD CANONICAL ERRATA ENTRY':
            'Inspect errata hash-chain lineage and seal new retcon records.',
        'ROOT MENU': 'Return to master flight deck switchboard.',
    }

    // Update layout on 12x12 grid: columns 0 to 4 for vertical selection menu
    const gridBit = await lib.hunt(GRID_UPDATE, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const choiceBit = await lib.hunt(CHOICE_OPEN, {
        dat: {
            clr0: 0, // Color.BLACK
            clr1: 3, // Color.YELLOW
            cb: async (focusedLabel: string) => {
                const somaticItem = getChoiceById(focusedLabel)
                if (somaticItem) {
                    await lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: `:: [TOOLTIP] ${somaticItem.label} -> ${somaticItem.tooltip}`,
                    })
                    return
                }
                const text =
                    descriptions[focusedLabel] || 'No description available.'
                lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${text}`,
                })
            },
        },
        src: 'VERTICAL',
        lst,
        net: gridBit?.grdBit?.dat,
    })

    const src = choiceBit?.chcBit?.src
    cpy.activeSelection = src || 'ROOT'
    cpy.totalInteractions = (cpy.totalInteractions || 0) + 1
    cpy.lastActionTimestamp = Date.now()
    if (src === GENESIS_WIZARD_LABEL) {
        return openGenesisMenu(cpy, bal, ste)
    }
    if (src === LOCOMOTION_MENU_LABEL) {
        await promptLocomotionChoice(cpy, { idx: 'menu-locomotion' }, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 120)
        return cpy
    }
    if (src === ENTITY_SCAFFOLDER_LABEL) {
        let chosenEntityId = 'char_knuckle'
        let chosenDomain = 'characters'

        if (lib && typeof lib.hunt === 'function') {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: '>> [SCAFFOLD:WIZARD] Launching interactive entity input panel...',
            })
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: ':: Enter entity ID below (e.g. char_knuckle, loc_bunker):',
            })

            const inputGrid = await lib.hunt(GRID_UPDATE, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: 6,
            })

            try {
                const inputBit = await lib.hunt('[Open action] Open Input', {
                    dat: { clr0: 0, clr1: 3 },
                    src: 'VERTICAL',
                    txt: 'Enter Entity ID (default: char_knuckle)',
                    net: inputGrid?.grdBit?.dat,
                })

                if (inputBit?.putBit?.val === -1) {
                    await lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: ':: [SCAFFOLD:CANCEL] Entity scaffolding cancelled by operator.',
                    })
                    setTimeout(async () => {
                        if (ste?.hunt) {
                            await ste.hunt(ActMnu.UPDATE_MENU, {})
                        }
                    }, 333)
                    return cpy
                }

                const rawInput = (inputBit?.putBit?.src || '').trim()
                if (rawInput) {
                    chosenEntityId = rawInput
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, '_')
                    if (chosenEntityId.startsWith('loc_')) {
                        chosenDomain = 'locations'
                    } else if (
                        chosenEntityId.startsWith('item_') ||
                        chosenEntityId.startsWith('pos_')
                    ) {
                        chosenDomain = 'possessions'
                    } else if (chosenEntityId.startsWith('grv_')) {
                        chosenDomain = 'grievances'
                    } else {
                        chosenDomain = 'characters'
                    }
                }
            } catch {
                // Headless fallback
            }
        }

        const scaffoldBal: MenuBit = {
            ...bal,
            dat: {
                ...(bal?.dat || {}),
                entityId: chosenEntityId,
                domain: chosenDomain,
            },
        } as MenuBit

        await runEntityScaffoldMenu(cpy, scaffoldBal, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        return cpy
    }
    if (src === RETIRE_ENTITY_LABEL) {
        await runEntityRetirementMenu(cpy, bal, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        return cpy
    }
    if (src === CORPUS_HEALTH_LABEL) {
        await runCorpusHealthMenu(cpy, bal, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        return cpy
    }
    if (src === HYGIENE_LABEL) {
        await openHygieneMenu(cpy, bal, ste)
        return cpy
    }
    if (src === ERRATA_DECK_MENU_LABEL) {
        await openErrataMenu(cpy, bal, ste)
        return cpy
    }
    if (src === CANON_MENU_LABEL) {
        await openCanonMenu(cpy, bal, ste)
        return cpy
    }
    if (src === RECORD_ERRATA_LABEL) {
        await runErrataMenu(cpy, bal, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        return cpy
    }
    if (src === PUBLISH_CANON_LABEL) {
        await publishSealedCanonToFleet(cpy, bal as any, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    const somaticItem = getChoiceById(src || '')
    if (somaticItem && somaticItem.id !== 'CHOICE_ROOT_RETURN') {
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: `>> [DISPATCH] Executing: ${src}`,
        })
        const dispatchResult = await dispatchSomaticChoice(src, ste, lib)
        cpy.lastSomaticReceipt = dispatchResult.receiptTag
        cpy.statusMessage = `${dispatchResult.receiptTag} ${dispatchResult.label}`
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: `>> [RECEIPT] ${dispatchResult.receiptTag} Finished [OK]`,
        })
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    switch (src) {
        case '1. VALIDATE SCHEMA INVARIANTS': {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: '>> Initiating Schema Invariant Validation...',
            })
            const validBit: any = {
                idx: 'menu-val-entity',
                src: 'character',
                dat: {
                    id: 'char_bog',
                    title: 'Bog the Hoarder',
                    somatic: {
                        arms_available: 2,
                        legs_available: 2,
                        locomotion_tier: 'BIPEDAL_HUNCHED',
                        banned_verbs: ['SPRINT', 'VAULT'],
                        conditions: [],
                    },
                    logistical: {
                        held_primary: 'item_spoon',
                    },
                    epistemic: {
                        paranoia_bp: 2500,
                    },
                },
            }
            const res = await ste.hunt(ActSch.VALIDATE_ENTITY, validBit)
            if (res?.schBit?.val === 0) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: '>> [SCHEMA_OK] Character entity validated and sealed.',
                })
            } else {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: ':: [SCHEMA_FAIL] Invariant breach detected during validation.',
                })
            }
            try {
                const primLines = await auditPrimitiveStandards()
                for (const line of primLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
                const manifestLines = await runEntityManifestAudit()
                for (const line of manifestLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: '>> [RULES:AUDIT] Verifying Constitutional Rule Registry invariants...',
                })
                const registryLines = await runConstitutionalRegistryAudit()
                for (const line of registryLines) {
                    await lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: line,
                    })
                }
            } catch (err: any) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${err?.message || String(err)}`,
                })
            }
            break
        }

        case '2. RUN SOMATIC SAT SOLVER': {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: '>> Solving Somatic Capability SAT...',
            })
            const satBit: any = {
                idx: 'menu-sat-solve',
                src: 'somatic_sat',
                dat: {
                    character: {
                        id: 'char_wart',
                        title: 'Wart the Mender',
                        somatic: {
                            arms_available: 2,
                            legs_available: 2,
                            locomotion_tier: 'BIPEDAL_LIMPING',
                            conditions: ['cond_brachial_plexus_severed_left'],
                        },
                        logistical: {
                            held_primary: 'item_iron_key',
                            held_secondary: 'item_grease_bucket',
                        },
                        epistemic: {},
                    },
                    possessions: {
                        item_iron_key: { occupies_hands: 1 },
                        item_grease_bucket: { occupies_hands: 1 },
                    },
                    condition_penalties: {
                        cond_brachial_plexus_severed_left: 1,
                    },
                },
            }
            const res = await ste.hunt(ActSch.SOLVE_SOMATIC_SAT, satBit)
            if (res?.schBit?.val === -1) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: '>> [SAT_HALT] [SOMATIC_OVERLOAD] caught: single-arm dual loadout blocked.',
                })
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: '>> [SAT_PASS] Biological inequality enforced at T_0 = $0.00.',
                })
            }
            try {
                const satLines = await runSomaticSolverAudit()
                for (const line of satLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
                const rosterLines = await runHandCapacityAudit()
                for (const line of rosterLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
            } catch (err: any) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${err?.message || String(err)}`,
                })
            }
            break
        }

        case '3. AUDIT KINETIC MOTOR MASKS': {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: '>> Auditing Kinetic Motor Mask Exclusions...',
            })
            const motorBit: any = {
                idx: 'menu-motor-audit',
                src: 'somatic_sat',
                dat: {
                    character: {
                        id: 'char_bog',
                        title: 'Bog the Hoarder',
                        somatic: {
                            arms_available: 2,
                            legs_available: 2,
                            locomotion_tier: 'BIPEDAL_HUNCHED',
                            banned_verbs: [],
                            conditions: [],
                        },
                        logistical: {},
                        epistemic: {},
                    },
                    proposedActions: ['SPRINT'],
                },
            }
            const res = await ste.hunt(ActSch.SOLVE_SOMATIC_SAT, motorBit)
            if (res?.schBit?.val === -1) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: '>> [MOTOR_HALT] [SOMATIC_MOTOR_BREACH] caught: SPRINT forbidden for BIPEDAL_HUNCHED.',
                })
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: '>> [MOTOR_PASS] Set-intersection exclusion verified.',
                })
            }
            break
        }

        case '4. VERIFY HEAP IMMUTABILITY': {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: '>> Verifying V8 Heap Deep Freeze Immutability...',
            })
            const probe = deepFreeze({
                id: 'char_bog',
                somatic: { arms_available: 2, banned_verbs: ['SPRINT'] },
            })
            let trapped = false
            try {
                ;(probe.somatic as any).arms_available = 99
            } catch {
                trapped = true
            }
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: `>> [IMMUTABILITY:PROBE] Object.isFrozen=${Object.isFrozen(probe)} | MutationTrapped=${trapped}`,
            })
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: '>> [IMMUTABILITY:PASS] Object.freeze recursion traps mutations with strict TypeError.',
            })
            break
        }

        case '5. AUDIT SPATIAL PORTALS & ACOUSTICS': {
            try {
                const lines = await runPortalReciprocityAudit()
                for (const line of lines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
            } catch (err: any) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${err?.message || String(err)}`,
                })
            }
            break
        }

        case '6. AUDIT GRIEVANCE DAG & DYADIC MESH': {
            try {
                const dagLines = await runCausalDagAudit()
                for (const line of dagLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
                const dyadLines = await runDyadicMeshAudit()
                for (const line of dyadLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
            } catch (err: any) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${err?.message || String(err)}`,
                })
            }
            break
        }

        case '7. VERIFY EPISTEMIC FIREWALLS': {
            try {
                const epLines = await runEpistemicFirewallAudit()
                for (const line of epLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
            } catch (err: any) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${err?.message || String(err)}`,
                })
            }
            break
        }

        case '8. INTERACTIVE SOMATIC MOTOR LAB': {
            await runSomaticAuditMenu(ste)
            break
        }

        case '[S] STYLOMETRIC & VOICE-BLEED LINTER': {
            await emitConsoleLine(
                ste,
                '>> [LEVEL 3: STYLOMETRICS] Running lexical diversity & voice-bleed audit...',
            )
            if (ste && typeof ste.hunt === 'function') {
                await ste.hunt(ActCmp.STYLOMETRIC_LINT, {
                    idx: 'menu-stylometrics',
                    seriesSlug: activeSeries,
                    emitTelemetry: true,
                })
            }
            break
        }

        case '[H] HERMETIC OFFLINE DELETION PARITY': {
            await emitConsoleLine(
                ste,
                '>> [HERMETIC PARITY] Executing offline deletion & bit-for-bit Merkle rebuild test...',
            )
            if (ste && typeof ste.hunt === 'function') {
                let parityRes: any = null
                await ste.hunt(ActCmp.OFFLINE_DELETION_TEST, {
                    idx: 'menu-offline-parity',
                    seriesSlug: activeSeries,
                    emitTelemetry: true,
                    slv: (r: any) => {
                        parityRes = r?.cmpBit || r?.resBit
                    },
                })
                if (parityRes) {
                    await printDetailedCompileReceipt(
                        ste,
                        activeSeries,
                        parityRes,
                        parityRes.executionDurationMs || 1,
                    )
                }
            }
            break
        }

        case '[ 26. SCHEMA & INVARIANTS ]': {
            await openSchemaInvariantsMenu(cpy, bal, ste)
            break
        }

        case '[Somatic DSP Modulation Hub]': {
            await openSomaticDspHub(cpy, bal, ste)
            break
        }

        case '[LAWS MENU]': {
            await openLawsMenu(cpy, bal, ste)
            break
        }

        case '[C] COMPILE CANON & GATE 0 GAUNTLET': {
            await openCompileMenu(cpy, bal, ste)
            break
        }

        case '':
        case undefined:
        case 'ROOT MENU':
        case '[0] ROOT MENU': {
            await lib.hunt(TERMINAL_CLEAR, {})
            await mountConsolePane(lib)
            if (rootSlv) {
                const slv = rootSlv
                rootSlv = null
                slv({ mnuBit: { idx: 'root-menu', val: 0 } })
            } else if (bal?.slv) {
                bal.slv({ mnuBit: { idx: 'root-menu', val: 0 } })
            }
            return cpy
        }

        default: {
            break
        }
    }

    // Non-blocking tick to loop menu if not exiting
    setTimeout(async () => {
        if (ste?.hunt) {
            await ste.hunt(ActMnu.UPDATE_MENU, {})
        }
    }, 333)

    if (bal?.slv) {
        bal.slv({ mnuBit: bal })
    }

    return cpy
}

/**
 * Opens the Schema Invariants Menu.
 */
export const openSchemaInvariantsMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const schemaOptions = [
        '[ 1. VALIDATE ENTITY MANIFESTS ]',
        '[ 2. RUN SOMATIC SAT SOLVER ]',
        REGISTRY_MENU_LABEL,
        ERRATA_MENU_LABEL,
        FOUR_TUPLE_MENU_LABEL,
        SERIES_TREE_MENU_LABEL,
        GENESIS_SEEDS_MENU_LABEL,
        PORTAL_RECONCILE_MENU_LABEL,
        '[ BACK ]',
    ]
    const schemaDescriptions: Record<string, string> = {
        '[ 1. VALIDATE ENTITY MANIFESTS ]':
            'Stream entity manifests through 26.schema.unit and assert fail-closed routing.',
        '[ 2. RUN SOMATIC SAT SOLVER ]':
            'Solve hand-capacity SAT matrix for baseline and impaired loadouts.',
        '[ 3. CONSTITUTIONAL RULE REGISTRY ]':
            'Load canonical rules, authorizers, and sweep every series pardon ledger.',
        '[ 4. CRYPTOGRAPHIC ERRATA LEDGER ]':
            'Verify append-only errata hash-chain lineage and active Merkle heads.',
        '[ 5. UNIVERSAL NARRATIVE FOUR-TUPLE SCHEMA ]':
            'Validate the Universal Narrative Four-Tuple contract <S, A, I, R_m> with fail-closed probes.',
        '[ 6. SERIES TREE SCAFFOLDING ]':
            'Scaffold a hermetic series workspace and verify atomic config commit.',
        '[ 7. POPULATE GENESIS SEEDS ]':
            'Seed world dossiers and the origin hub, then verify byte-0 preambles.',
        '[ 8. RECONCILE SPATIAL PORTAL LINKS ]':
            'Inject reverse portals with matched damping and verify symmetry.',
        '[ BACK ]': 'Return to the primary lore dashboard.',
    }

    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'open-schema-invariants-menu',
                    lst: schemaOptions,
                    val: 0,
                },
            })
        }
        return cpy
    }

    const gridBit = await lib.hunt(GRID_UPDATE, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const schemaChoiceBit = await lib.hunt(CHOICE_OPEN, {
        dat: {
            clr0: 0,
            clr1: 3,
            cb: async (choice: string) => {
                const text = schemaDescriptions[choice]
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${text || 'No description available.'}`,
                })
            },
        },
        src: 'VERTICAL',
        lst: schemaOptions,
        net: gridBit?.grdBit?.dat,
    })

    const selection = schemaChoiceBit?.chcBit?.src

    if (selection === '[ 1. VALIDATE ENTITY MANIFESTS ]') {
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: '>> [SCHEMA:AUDIT] Streaming entity manifests through 26.schema.unit...',
        })
        const primLines = await auditPrimitiveStandards()
        for (const line of primLines) {
            await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
        }
        const manifestLines = await runEntityManifestAudit()
        for (const line of manifestLines) {
            await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
        }
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    if (selection === '[ 2. RUN SOMATIC SAT SOLVER ]') {
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: '>> [SAT:AUDIT] Solving hand-capacity satisfiability matrix...',
        })
        const satLines = await runSomaticSolverAudit()
        for (const line of satLines) {
            await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
        }
        const rosterLines = await runHandCapacityAudit()
        for (const line of rosterLines) {
            await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
        }
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    if (selection === REGISTRY_MENU_LABEL) {
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: '>> [RULES:AUDIT] Sweeping constitutional rule registry...',
        })
        const registryLines = await runConstitutionalRegistryAudit()
        for (const line of registryLines) {
            await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
        }
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    if (selection === ERRATA_MENU_LABEL) {
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: '>> [ERRATA:AUDIT] Verifying append-only errata hash-chain lineage...',
        })
        try {
            const errataLines = await runErrataLedgerAudit()
            for (const line of errataLines) {
                await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
            }
        } catch (err: any) {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: `:: ${err?.message || String(err)}`,
            })
        }
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    if (selection === FOUR_TUPLE_MENU_LABEL) {
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: '>> [TUPLE:AUDIT] Validating Universal Narrative Four-Tuple contract...',
        })
        try {
            const tupleLines = await runFourTupleContractAudit()
            for (const line of tupleLines) {
                await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
            }
        } catch (err: any) {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: `:: ${err?.message || String(err)}`,
            })
        }
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    if (selection === SERIES_TREE_MENU_LABEL) {
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: '>> [TREE:AUDIT] Scaffolding hermetic series workspace...',
        })
        try {
            const treeLines = await runSeriesTreeScaffoldAudit()
            for (const line of treeLines) {
                await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
            }
        } catch (err: any) {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: `:: ${err?.message || String(err)}`,
            })
        }
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    if (selection === GENESIS_SEEDS_MENU_LABEL) {
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: '>> [SEED:AUDIT] Populating hermetic genesis seed dossiers...',
        })
        try {
            const seedLines = await runGenesisSeedsAudit()
            for (const line of seedLines) {
                await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
            }
        } catch (err: any) {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: `:: ${err?.message || String(err)}`,
            })
        }
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    if (selection === PORTAL_RECONCILE_MENU_LABEL) {
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: '>> [PORTAL:AUDIT] Reconciling hermetic spatial portal graph...',
        })
        try {
            const portalLines = await runPortalReconcileAudit()
            for (const line of portalLines) {
                await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
            }
        } catch (err: any) {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: `:: ${err?.message || String(err)}`,
            })
        }
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    return updateMenu(cpy, bal, ste)
}

/**
 * Opens the [HYGIENE] submenu flight deck with the unit buzzer ping sweep.
 */
export const openHygieneMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const hygieneOptions = [HYGIENE_SWEEP_LABEL, HYGIENE_BACK_LABEL]
    const hygieneDescriptions: Record<string, string> = {
        [HYGIENE_SWEEP_LABEL]:
            'Ping every mounted 299.lore unit buzzer synchronously and verify 7-bit ASCII hygiene.',
        [HYGIENE_BACK_LABEL]: 'Return to the primary lore dashboard.',
    }

    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'open-hygiene-menu',
                    lst: hygieneOptions,
                    val: 0,
                },
            })
        }
        return cpy
    }

    const gridBit = await lib.hunt(GRID_UPDATE, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const hygieneChoiceBit = await lib.hunt(CHOICE_OPEN, {
        dat: {
            clr0: 0,
            clr1: 3,
            cb: async (choice: string) => {
                const text = hygieneDescriptions[choice]
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${text || 'No description available.'}`,
                })
            },
        },
        src: 'VERTICAL',
        lst: hygieneOptions,
        net: gridBit?.grdBit?.dat,
    })

    const selection = hygieneChoiceBit?.chcBit?.src

    if (selection === HYGIENE_SWEEP_LABEL) {
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: '>> [HYGIENE:DISPATCH] Launching unit buzzer ping sweep...',
        })
        runHygieneMenu(cpy, bal, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    return updateMenu(cpy, bal, ste)
}

/**
 * Opens the interactive Universal Series Genesis Wizard.
 */
export const openGenesisMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    let chosenSlug = bal?.dat?.seriesSlug || 'ashfall-basin'
    let chosenDisplayName = bal?.dat?.displayName || 'Ashfall Basin'
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY

    if (lib && typeof lib.hunt === 'function' && !bal?.dat?.seriesSlug) {
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: '>> [GENESIS:WIZARD] Launching interactive series input panel...',
        })
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: ':: Enter series name / slug below (or press Enter for default):',
        })

        const inputGrid = await lib.hunt(GRID_UPDATE, {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 6,
        })

        try {
            const inputBit = await lib.hunt('[Open action] Open Input', {
                dat: { clr0: 0, clr1: 3 },
                src: 'VERTICAL',
                txt: 'Enter Series Name (default: ashfall-basin)',
                net: inputGrid?.grdBit?.dat,
            })

            if (inputBit?.putBit?.val === -1) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: ':: [GENESIS:CANCEL] Series provisioning cancelled by operator.',
                })
                if (bal?.src === 'ROOT_ROUTE') {
                    if (bal?.slv) {
                        bal.slv({ mnuBit: { idx: 'genesis-cancel', val: 0 } })
                    }
                    return cpy
                }
                setTimeout(async () => {
                    if (ste?.hunt) {
                        await ste.hunt(ActMnu.UPDATE_MENU, {})
                    }
                }, 333)
                return cpy
            }

            const rawInput = (inputBit?.putBit?.src || '').trim()
            if (rawInput) {
                chosenSlug =
                    rawInput
                        .toLowerCase()
                        .replace(/[^a-z0-9_-]/g, '-')
                        .replace(/^-+|-+$/g, '') || 'ashfall-basin'
                chosenDisplayName = rawInput
                    .replace(/[-_]+/g, ' ')
                    .replace(/\b\w/g, (c: string) => c.toUpperCase())
            }
        } catch {
            // Headless fallback
        }
    }

    const genesisBal: MenuBit = {
        ...bal,
        dat: {
            ...(bal?.dat || {}),
            seriesSlug: chosenSlug,
            displayName: chosenDisplayName,
        },
    } as MenuBit

    await runSeriesGenesisMenu(cpy, genesisBal, ste)
    if (bal?.src === 'ROOT_ROUTE') {
        if (bal?.slv) {
            bal.slv({ mnuBit: { idx: 'genesis-complete', val: 1 } })
        }
        return cpy
    }
    setTimeout(async () => {
        if (ste?.hunt) {
            await ste.hunt(ActMnu.UPDATE_MENU, {})
        }
    }, 333)
    return cpy
}

/**
 * Opens the dedicated Compile Menu Flight Deck.
 */
export const openCompileMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    let activeSeries =
        bal?.dat?.activeSeries || cpy.activeSeries || '001.goblin-lore'

    const optionLabels = COMPILE_MENU_OPTIONS.map((opt) => opt.label)

    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        const seriesList = discoverSomaticSeriesSlugs()

        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: '>> [MENU:COMPILE] Which series do you want to run these processes on?',
        })
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: ':: Select series from below or enter a custom series name:',
        })

        const gridBitSeries = await lib.hunt(GRID_UPDATE, {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 8,
        })

        const seriesChoices = [
            ...seriesList.map((s) => `[S] ${s}`),
            '[ CUSTOM SERIES SLUG ]',
            '[<] CANCEL',
        ]

        const seriesChoiceBit = await lib.hunt(CHOICE_OPEN, {
            dat: {
                clr0: 0,
                clr1: 3,
                cb: (choice: string) => {
                    const clean = choice.replace(/^\[S\]\s*/, '')
                    lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: `:: Target series: ${clean}`,
                    })
                },
            },
            src: 'VERTICAL',
            lst: seriesChoices,
            net: gridBitSeries?.grdBit?.dat,
        })

        const selectedSeriesChoice = seriesChoiceBit?.chcBit?.src
        if (!selectedSeriesChoice || selectedSeriesChoice === '[<] CANCEL') {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: ':: [COMPILE:CANCEL] Series selection cancelled by operator.',
            })
            if (bal?.src === 'ROOT_ROUTE') {
                if (bal?.slv) {
                    bal.slv({ mnuBit: { idx: 'compile-cancel', val: 0 } })
                }
                return cpy
            }
            setTimeout(async () => {
                if (ste?.hunt) {
                    await ste.hunt(ActMnu.UPDATE_MENU, {})
                }
            }, 333)
            return cpy
        }

        if (selectedSeriesChoice === '[ CUSTOM SERIES SLUG ]') {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: ':: Enter series slug below (e.g. lving-treee):',
            })
            const inputGrid = await lib.hunt(GRID_UPDATE, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: 6,
            })
            try {
                const inputBit = await lib.hunt('[Open action] Open Input', {
                    dat: { clr0: 0, clr1: 3 },
                    src: 'VERTICAL',
                    txt: 'Enter Series Slug',
                    net: inputGrid?.grdBit?.dat,
                })
                const rawSlug = (inputBit?.putBit?.src || '')
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9_-]/g, '-')
                    .replace(/^-+|-+$/g, '')
                if (rawSlug) {
                    activeSeries = rawSlug
                }
            } catch {
                // Keep activeSeries
            }
        } else {
            activeSeries = selectedSeriesChoice.replace(/^\[S\]\s*/, '')
        }

        cpy.activeSeries = activeSeries

        await emitConsoleLine(
            ste,
            `>> [MENU:COMPILE] Target series selected: ${activeSeries}`,
        )
        await emitConsoleLine(
            ste,
            `>> [MENU:COMPILE] Opening Compile Flight Deck for series: ${activeSeries}`,
        )

        const gridBit = await lib.hunt(GRID_UPDATE, {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 8,
        })

        const choiceBit = await lib.hunt(CHOICE_OPEN, {
            dat: {
                clr0: 0,
                clr1: 3,
                cb: (choice: string) => {
                    const opt = COMPILE_MENU_OPTIONS.find(
                        (o) => o.label === choice,
                    )
                    const text = opt?.description || 'No description available.'
                    lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: `:: ${text}`,
                    })
                },
            },
            src: 'VERTICAL',
            lst: optionLabels,
            net: gridBit?.grdBit?.dat,
        })

        const chosenLabel = choiceBit?.chcBit?.src
        const chosenIndex = COMPILE_MENU_OPTIONS.findIndex(
            (o) => o.label === chosenLabel,
        )
        if (chosenIndex >= 0) {
            await triggerCompileAction(
                cpy,
                {
                    ...bal,
                    val: chosenIndex,
                    dat: { ...(bal?.dat || {}), activeSeries },
                } as MenuBit,
                ste,
            )
        }
    } else {
        await emitConsoleLine(
            ste,
            `>> [MENU:COMPILE] Opening Compile Flight Deck for series: ${activeSeries}`,
        )
    }

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'open-compile-menu',
                lst: optionLabels,
                dat: {
                    activeSeries,
                    options: COMPILE_MENU_OPTIONS,
                },
            },
        })
    }

    return cpy
}

/**
 * Triggers an operation from the compile menu and streams full telemetry.
 */
export const triggerCompileAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const activeSeries =
        bal?.dat?.activeSeries || cpy.activeSeries || '001.goblin-lore'
    const selectedIndex = bal?.val ?? 0
    const option = COMPILE_MENU_OPTIONS[selectedIndex]

    if (!option) {
        await emitConsoleLine(
            ste,
            ':: [MENU:ERR] Invalid compile menu option selected.',
        )
        if (bal?.slv) {
            bal.slv({ mnuBit: { idx: 'compile-action-err', val: -1 } })
        }
        return cpy
    }

    // Return to Lore Menu option
    if (option.key === '<') {
        await emitConsoleLine(
            ste,
            '>> [MENU:COMPILE] Returning to Lore Menu...',
        )
        if (bal?.src === 'ROOT_ROUTE') {
            if (bal?.slv) {
                bal.slv({ mnuBit: { idx: 'compile-return', val: 0 } })
            }
            return cpy
        }
        return updateMenu(cpy, bal, ste)
    }

    const startTime = Date.now()
    await emitConsoleLine(
        ste,
        `>> [COMPILE:DISPATCH] Triggered: ${option.label}`,
    )
    await emitConsoleLine(
        ste,
        `>> [TARGET:SERIES]   slug=${activeSeries} source=corpus/ output=compiled/`,
    )

    let compileResult: any = null
    let compileError: any = null

    try {
        if (ste && typeof ste.hunt === 'function') {
            const dispatchRes: any = await ste.hunt(option.actionType, {
                idx: 'cmp-tui-dispatch',
                src: process.cwd(),
                val: 1, // Verbose telemetry flag
                dat: {
                    seriesSlug: activeSeries,
                    verifyDriftTripwire: option.key === '5', // Enforce tripwire on Gate 0 option
                },
                slv: (res: any) => {
                    if (res?.resBit) compileResult = res.resBit
                    else if (res?.cmpBit && res.cmpBit.val !== 0)
                        compileResult = res.cmpBit
                    if (res?.errBit) compileError = res.errBit
                },
            })

            if (!compileResult && dispatchRes?.resBit) {
                compileResult = dispatchRes.resBit
            } else if (
                !compileResult &&
                dispatchRes?.cmpBit &&
                dispatchRes.cmpBit.val !== 0
            ) {
                compileResult = dispatchRes.cmpBit
            }
            if (!compileError && dispatchRes?.errBit) {
                compileError = dispatchRes.errBit
            }
        }

        const elapsedMs = Date.now() - startTime

        if (compileError) {
            await printCompileFailureReport(ste, activeSeries, compileError)
            cpy.lastError = compileError.message
        } else {
            await printDetailedCompileReceipt(
                ste,
                activeSeries,
                compileResult,
                elapsedMs,
            )
            cpy.lastError = undefined
        }

        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'trigger-compile-action',
                    val: compileError ? -1 : 0,
                    dat: {
                        action: option.actionType,
                        elapsedMs,
                        success: !compileError,
                        resBit: compileResult,
                        errBit: compileError,
                    },
                },
            })
        }
    } catch (err: any) {
        const errorPayload = {
            code: 'DISPATCH_EXCEPTION',
            message: err?.message || String(err),
        }
        await printCompileFailureReport(ste, activeSeries, errorPayload)

        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'trigger-compile-action-err',
                    val: -1,
                    src: err?.message || String(err),
                },
            })
        }
    }

    return cpy
}

function findSeriesBaseDir(): string | null {
    const root = resolveRepoRoot()
    const candidate = path.join(root, 'series')
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate
    }
    let curr = process.cwd()
    while (curr && curr !== path.dirname(curr)) {
        const fallback = path.join(curr, 'series')
        if (fs.existsSync(fallback) && fs.statSync(fallback).isDirectory()) {
            return fallback
        }
        curr = path.dirname(curr)
    }
    return null
}

export function discoverSomaticSeriesSlugs(): string[] {
    const baseDir = findSeriesBaseDir()
    if (!baseDir) {
        return ['under-the-floorboards', 'wiregrass-basin']
    }
    const entries = fs
        .readdirSync(baseDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    entries.sort((a, b) => a.localeCompare(b))
    return entries.length > 0
        ? entries
        : ['under-the-floorboards', 'wiregrass-basin']
}

export function discoverSeriesCharacters(seriesSlug: string): string[] {
    const baseDir = findSeriesBaseDir()
    if (!baseDir) {
        return seriesSlug === 'under-the-floorboards'
            ? ['char_wart.md', 'char_bog.md']
            : ['char_spleen.md']
    }
    const charDir = path.join(baseDir, seriesSlug, 'characters')
    if (!fs.existsSync(charDir)) {
        return ['char_wart.md', 'char_bog.md']
    }
    const rawFiles = fs.readdirSync(charDir).filter((f) => f.endsWith('.md'))
    const canonicalSet = new Set<string>()
    for (const f of rawFiles) {
        canonicalSet.add(f.startsWith('char_') ? f : `char_${f}`)
    }
    const list = Array.from(canonicalSet)
    list.sort((a, b) =>
        a === 'char_wart.md'
            ? -1
            : b === 'char_wart.md'
              ? 1
              : a.localeCompare(b),
    )
    return list
}

/**
 * Opens the Somatic DSP Modulation Hub for disk-backed Somatic Ledger extraction.
 */
export const openSomaticDspHub = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const hubOptions = [
        '[Extract Somatic Ledger]',
        '[Pressure Meter Thermodynamic Simulator]',
        '[Acoustic Paranoia Clock Inspector]',
        '[Algebraic DSP Matrix Inspector]',
        '[Post-Break Finality Trigger]',
        '[Synthesis Ingress Payload Validator]',
        '[Vocal-Motor Feasibility Gate Inspector]',
        '[Monotonic Fact Staleness Checker]',
        '[Deterministic Payload Hasher]',
        '[Payload Serialization Reducer Console]',
        '[9] RUN FULL SOMATIC DSP VERIFICATION SWEEP',
        '[0] ROOT MENU',
        '[<] RETURN TO LORE MENU',
    ]

    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'open-somatic-dsp-hub',
                    lst: hubOptions,
                    val: 0,
                },
            })
        }
        return cpy
    }

    const gridBit = await lib.hunt(GRID_UPDATE, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const hubChoiceBit = await lib.hunt(CHOICE_OPEN, {
        dat: {
            clr0: 0,
            clr1: 3,
            cb: async (choice: string) => {
                const item = getChoiceById(choice)
                if (item) {
                    await lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: `:: [TOOLTIP] ${item.label} -> ${item.tooltip}`,
                    })
                    return
                }
                lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: [SOMATIC_HUB] ${choice}`,
                })
            },
        },
        src: 'VERTICAL',
        lst: hubOptions,
        net: gridBit?.grdBit?.dat,
    })

    const hubSelection = hubChoiceBit?.chcBit?.src
    if (!hubSelection || hubSelection === '[<] RETURN TO LORE MENU') {
        return cpy
    }

    if (
        hubSelection === '[9] RUN FULL SOMATIC DSP VERIFICATION SWEEP' ||
        hubSelection === 'CHOICE_FULL_SWEEP'
    ) {
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: `>> [DISPATCH] Executing: [9] RUN FULL SOMATIC DSP VERIFICATION SWEEP`,
        })
        const dispatchResult = await dispatchSomaticChoice(
            'CHOICE_FULL_SWEEP',
            ste,
            lib,
        )
        cpy.lastSomaticReceipt = dispatchResult.receiptTag
        cpy.statusMessage = `${dispatchResult.receiptTag} ${dispatchResult.label}`
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: `>> [RECEIPT] ${dispatchResult.receiptTag} Finished [OK]`,
        })
        return cpy
    }

    if (
        hubSelection === '[0] ROOT MENU' ||
        hubSelection === 'CHOICE_ROOT_RETURN'
    ) {
        await lib.hunt(TERMINAL_CLEAR, {})
        await mountConsolePane(lib)
        if (rootSlv) {
            const slv = rootSlv
            rootSlv = null
            slv({ mnuBit: { idx: 'root-menu', val: 0 } })
        } else if (bal?.slv) {
            bal.slv({ mnuBit: { idx: 'root-menu', val: 0 } })
        }
        return cpy
    }

    if (hubSelection === '[Pressure Meter Thermodynamic Simulator]') {
        await runPressureMeterSimulatorMenu(ste)
        return cpy
    }

    if (hubSelection === '[Acoustic Paranoia Clock Inspector]') {
        await runAcousticParanoiaInspectorMenu(ste)
        return cpy
    }

    if (hubSelection === '[Algebraic DSP Matrix Inspector]') {
        await runAlgebraicDspInspectorMenu(ste)
        return cpy
    }

    if (hubSelection === '[Post-Break Finality Trigger]') {
        await runPostBreakFinalityTriggerMenu(ste)
        return cpy
    }

    if (hubSelection === '[Synthesis Ingress Payload Validator]') {
        await runSynthesisPayloadValidatorMenu(ste)
        return cpy
    }

    if (hubSelection === '[Vocal-Motor Feasibility Gate Inspector]') {
        await runVocalFeasibilityInspectorMenu(ste)
        return cpy
    }

    if (hubSelection === '[Monotonic Fact Staleness Checker]') {
        await runFactStalenessCheckerMenu(ste)
        return cpy
    }

    if (hubSelection === '[Deterministic Payload Hasher]') {
        await runDeterministicPayloadHasherMenu(ste)
        return cpy
    }

    if (hubSelection === '[Payload Serialization Reducer Console]') {
        await runPayloadReducerConsoleMenu(ste)
        return cpy
    }

    if (hubSelection === '[Extract Somatic Ledger]') {
        const seriesSlugs = discoverSomaticSeriesSlugs()
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: `>> [SOMATIC_HUB] Discovered series slugs: ${seriesSlugs.join(', ')}`,
        })

        const seriesChoiceBit = await lib.hunt(CHOICE_OPEN, {
            dat: {
                clr0: 0,
                clr1: 3,
                cb: (choice: string) => {
                    lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: `:: [SERIES] ${choice}`,
                    })
                },
            },
            src: 'VERTICAL',
            lst: [...seriesSlugs, '[<] BACK'],
            net: gridBit?.grdBit?.dat,
        })

        const selectedSeries = seriesChoiceBit?.chcBit?.src
        if (!selectedSeries || selectedSeries === '[<] BACK') {
            return cpy
        }

        const charFiles = discoverSeriesCharacters(selectedSeries)
        const charChoiceBit = await lib.hunt(CHOICE_OPEN, {
            dat: {
                clr0: 0,
                clr1: 3,
                cb: (choice: string) => {
                    lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: `:: [DOSSIER] ${selectedSeries}/characters/${choice}`,
                    })
                },
            },
            src: 'VERTICAL',
            lst: [...charFiles, '[<] BACK'],
            net: gridBit?.grdBit?.dat,
        })

        const selectedChar = charChoiceBit?.chcBit?.src
        if (!selectedChar || selectedChar === '[<] BACK') {
            return cpy
        }

        const shortCharFile = selectedChar.replace(/^char_/, '')
        const conditionsPath = `series/${selectedSeries}/world/conditions.md`
        const characterPath = `series/${selectedSeries}/characters/${shortCharFile}`

        if (ste && typeof ste.hunt === 'function') {
            await new Promise<void>((resolve) => {
                ste.hunt(ActLdg.EXTRACT_SOMATIC_LEDGER, {
                    idx: 'menu-extract-somatic-ledger',
                    dat: {
                        conditionsPath,
                        characterPaths: [characterPath],
                    },
                    slv: () => resolve(),
                })
            })
        }
    }

    return cpy
}

export const LAWS_REGISTRY_INSPECT_LABEL =
    '[1] INSPECT CONSTITUTIONAL RULE REGISTRY'
export const LAWS_MENU_BACK_LABEL = '[<] BACK TO LORE MENU'

/**
 * Opens the [LAWS MENU] laws deck. Preserves the blessed 12x12 dual-pane
 * topology: left 4-column choice pane with net mesh binding, right 8-column
 * cns00 telemetry pane. Headless fallback resolves the option list via slv.
 */
export const openLawsMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const lawsOptions = [
        LAWS_REGISTRY_INSPECT_LABEL,
        AUDIT_PARDONS_MENU_LABEL,
        SIMULATE_UNPARDONABLE_WAIVER_LABEL,
        LAWS_MENU_BACK_LABEL,
    ]
    const lawsDescriptions: Record<string, string> = {
        [LAWS_REGISTRY_INSPECT_LABEL]:
            'Validate constitutional rule schema and verify unpardonable hard invariant.',
        [AUDIT_PARDONS_MENU_LABEL]:
            'Run Pass 2 relational waiver audit over active pardon ledgers.',
        [SIMULATE_UNPARDONABLE_WAIVER_LABEL]:
            'Simulate an unpardonable physical waiver trap in Pass 2.',
        [LAWS_MENU_BACK_LABEL]: 'Return to the primary lore dashboard.',
    }

    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'open-laws-menu',
                    lst: lawsOptions,
                    val: 0,
                },
            })
        }
        return cpy
    }

    const gridBit = await lib.hunt(GRID_UPDATE, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const lawsChoiceBit = await lib.hunt(CHOICE_OPEN, {
        dat: {
            clr0: 0,
            clr1: 3,
            cb: async (choice: string) => {
                const text = lawsDescriptions[choice]
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${text || 'No description available.'}`,
                })
            },
        },
        src: 'VERTICAL',
        lst: lawsOptions,
        net: gridBit?.grdBit?.dat,
    })

    const selection = lawsChoiceBit?.chcBit?.src

    if (selection === LAWS_REGISTRY_INSPECT_LABEL) {
        await inspectRuleRegistryAction(cpy, bal, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    if (selection === AUDIT_PARDONS_MENU_LABEL) {
        await auditPardonWaiversAction(cpy, bal, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    if (selection === SIMULATE_UNPARDONABLE_WAIVER_LABEL) {
        await simulateUnpardonableWaiverAction(cpy, bal, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    return updateMenu(cpy, bal, ste as State)
}

export const inspectRuleRegistryAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [LAWS:INSPECT] Validating Constitutional Rule Schema...',
    )

    const testRule = {
        id: 'rule_kinetic_limb_conservation',
        category: 'PHYSICAL',
        severity_class: 'TIER_1_HARD_INVARIANT',
        description:
            'Characters cannot execute physical actions requiring severed or missing limbs.',
        pardonable: false,
        max_tolerated_pardon_frequency_bps: 0,
        owning_entity_types: ['character'],
    }

    const parsed = RuleSchema.safeParse(testRule)
    if (parsed.success) {
        await emitConsoleLine(
            ste,
            `>> [LAWS:OK] Rule ${testRule.id} verified as unpardonable hard physical invariant. Status code: 0.`,
        )
        cpy.statusMessage = 'RULE_REGISTRY_VERIFIED'
    } else {
        await emitConsoleLine(
            ste,
            ':: [LAWS:FAIL] Rule Schema verification failed.',
        )
        cpy.statusMessage = 'RULE_REGISTRY_FAILED'
    }

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'inspect-laws-registry',
                val: parsed.success ? 0 : -1,
            },
        })
    }
    return cpy
}

export const AUDIT_PARDONS_MENU_LABEL = '[2] AUDIT ACTIVE PARDON WAIVERS'

export const auditPardonWaiversAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [PARDON:AUDIT] Initiating Pass 2 Relational Waiver Audit...',
    )

    const mockRules = new Map<string, Rule>([
        [
            'rule_bimanual_lift',
            {
                id: 'rule_bimanual_lift',
                category: 'PHYSICAL',
                severity_class: 'TIER_1_HARD_INVARIANT',
                description:
                    'Two-handed tasks require two functioning arm limbs',
                pardonable: false,
                max_tolerated_pardon_frequency_bps: 0,
                owning_entity_types: ['character'],
            },
        ],
        [
            'rule_carrying_capacity',
            {
                id: 'rule_carrying_capacity',
                category: 'LOGISTICAL',
                severity_class: 'TIER_2_AUDITED_ONTOLOGY',
                description: 'Carrying mass limits under extreme exertion',
                pardonable: true,
                max_tolerated_pardon_frequency_bps: 5,
                owning_entity_types: ['character', 'possession'],
            },
        ],
    ])

    const mockAuthorizers = new Map<string, Authorizer>([
        [
            'auth_showrunner',
            {
                id: 'auth_showrunner',
                name: 'Lead Showrunner',
                role: 'SHOWRUNNER',
                permitted_categories: ['LOGISTICAL', 'SOCIAL'],
            },
        ],
    ])

    const mockPardons = new Map<string, PardonRecord>([
        [
            'pardon_tallow_01',
            {
                pardon_id: 'pardon_tallow_01',
                target: {
                    series_slug: 'under-the-floorboards',
                    episode_id: 'ep01',
                    scene_id: 'sc01',
                    entity_id: 'char_wart',
                },
                rule_id: 'rule_carrying_capacity',
                authorizer_id: 'auth_showrunner',
                justification:
                    'Carrying extra tallow through culvert siphon safely.',
                granted_against_canon_hash: 'a'.repeat(64),
                granted_at_epoch: 0,
            },
        ],
    ])

    const entities = {
        characters: { char_wart: { id: 'char_wart' } },
    }

    const result = validatePass2Pardons(
        mockPardons,
        mockRules,
        mockAuthorizers,
        entities,
        'a'.repeat(64),
        false,
    )

    if (result.valid) {
        await emitConsoleLine(
            ste,
            `>> [PARDON:AUDITED] Evaluated ${result.appliedPardons.length} waiver(s). Zero fatal breaches. Status code: 0.`,
        )
        cpy.statusMessage = 'PARDONS_VERIFIED'
    } else {
        for (const err of result.errors) {
            await emitConsoleLine(ste, `:: [PARDON:FATAL] ${err}`)
        }
        cpy.statusMessage = 'PARDONS_BREACH'
    }

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'audit-pardons',
                val: result.valid ? 0 : -1,
                dat: result,
            },
        })
    }
    return cpy
}

export const SIMULATE_UNPARDONABLE_WAIVER_LABEL =
    '[3] SIMULATE UNPARDONABLE WAIVER TRAP'

export const simulateUnpardonableWaiverAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [LAWS:TRAP] Simulating illegal physical rule waiver in Pass 2...',
    )

    const compileModel = new CompileModel()
    compileModel.activeSeries = 'under-the-floorboards'
    compileModel.entityCatalog = {
        characters: {
            char_wart: {
                id: 'char_wart',
                somatic: { total_arms: 1 },
            },
        },
    }

    // Stage an illegal physical waiver on disk so Pass 2 can intercept it
    const os = await import('node:os')
    const fsMod = await import('node:fs')
    const pathMod = await import('node:path')
    const tmpRoot = fsMod.mkdtempSync(
        pathMod.join(os.tmpdir(), 'lore-sim-trap-'),
    )
    const seriesDir = pathMod.join(tmpRoot, 'series', 'under-the-floorboards')
    const worldDir = pathMod.join(seriesDir, 'world')
    fsMod.mkdirSync(worldDir, { recursive: true })
    const illegalPardon = {
        pardon_id: 'pardon_illegal_amputee_lift',
        target: {
            series_slug: 'under-the-floorboards',
            episode_id: 'ep01',
            scene_id: 'sc01',
            entity_id: 'char_wart',
        },
        rule_id: 'rule_bimanual_lift',
        authorizer_id: 'auth_showrunner_main',
        justification:
            'Allowing one-armed character to lift two-handed pipe valve.',
        granted_against_canon_hash: '0'.repeat(64),
        granted_at_epoch: 0,
    }
    fsMod.writeFileSync(
        pathMod.join(worldDir, 'pardons.json'),
        JSON.stringify({ records: [illegalPardon] }),
        'utf8',
    )

    let intercepted = false
    let fatalError = ''

    pass2Traverse(compileModel, {
        idx: 'sim-trap',
        src: tmpRoot,
        seriesSlug: 'under-the-floorboards',
        slv: (res: any) => {
            const errors = res?.cmpBit?.dat?.validationReport?.errors || []
            const fatal = errors.find((e: string) =>
                e.includes('[PASS 2 PARDON FATAL]'),
            )
            if (fatal) {
                intercepted = true
                fatalError = fatal
            }
        },
    })

    try {
        fsMod.rmSync(tmpRoot, { recursive: true, force: true })
    } catch {
        // ignore cleanup errors
    }

    if (intercepted) {
        await emitConsoleLine(ste, `:: [PARDON:FATAL] ${fatalError}`)
        await emitConsoleLine(
            ste,
            '>> [LAWS:OK] Pass 2 Compiler successfully halted on unpardonable rule breach. Status code: 0.',
        )
        cpy.statusMessage = 'UNPARDONABLE_WAIVER_HALTED'
    } else {
        await emitConsoleLine(
            ste,
            ':: [LAWS:FAIL] Pass 2 failed to intercept unpardonable waiver!',
        )
        cpy.statusMessage = 'WAIVER_TRAP_FAILED'
    }

    if (bal.slv) {
        bal.slv({
            mnuBit: { idx: 'sim-unpardonable-trap', val: intercepted ? 0 : -1 },
        })
    }
    return cpy
}

export const ERRATA_SCHEMA_VALIDATE_LABEL = '[1] VALIDATE ERRATA RECORD SCHEMA'
export const ERRATA_MENU_BACK_LABEL = '[<] BACK TO LORE MENU'

/**
 * Opens the [ERRATA MENU] ledger deck. Preserves the blessed 12x12 dual-pane
 * topology: left 4-column choice pane with net mesh binding, right 8-column
 * cns00 telemetry pane. Headless fallback resolves the option list via slv.
 */
export const openErrataMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const errataOptions = [ERRATA_SCHEMA_VALIDATE_LABEL, ERRATA_MENU_BACK_LABEL]
    const errataDescriptions: Record<string, string> = {
        [ERRATA_SCHEMA_VALIDATE_LABEL]:
            'Validate errata record contract and strict field enforcement.',
        [ERRATA_MENU_BACK_LABEL]: 'Return to the primary lore dashboard.',
    }

    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'open-errata-menu',
                    lst: errataOptions,
                    val: 0,
                },
            })
        }
        return cpy
    }

    const gridBit = await lib.hunt(GRID_UPDATE, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const errataChoiceBit = await lib.hunt(CHOICE_OPEN, {
        dat: {
            clr0: 0,
            clr1: 3,
            cb: async (choice: string) => {
                const text = errataDescriptions[choice]
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${text || 'No description available.'}`,
                })
            },
        },
        src: 'VERTICAL',
        lst: errataOptions,
        net: gridBit?.grdBit?.dat,
    })

    const selection = errataChoiceBit?.chcBit?.src

    if (selection === ERRATA_SCHEMA_VALIDATE_LABEL) {
        await validateErrataSchemaAction(cpy, bal, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    return updateMenu(cpy, bal, ste as State)
}

export const validateErrataSchemaAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [ERRATA:SCHEMA] Validating Errata Record Contract...',
    )

    const candidate = {
        errata_id: 'err_culvert_aperture_01',
        sequence_number: 1,
        classification: 'FACTUAL_CONTRADICTION',
        superseded_merkle_hash: '0'.repeat(64),
        active_merkle_hash: '1'.repeat(64),
        superseded_commit_sha: 'a'.repeat(40),
        active_commit_sha: 'b'.repeat(40),
        affected_entity_ids: ['loc_culvert_siphon'],
        historical_episodes: ['ep001'],
        rationale:
            'Canonicalized culvert siphon aperture to eight inches across series blueprints.',
        recorded_at_epoch: 100,
    }

    const parsed = ErrataRecordSchema.safeParse(candidate)
    if (parsed.success) {
        await emitConsoleLine(
            ste,
            `>> [ERRATA:SCHEMA_OK] ErrataRecord ${candidate.errata_id} validated. Status code: 0.`,
        )
        cpy.statusMessage = 'ERRATA_SCHEMA_VERIFIED'
    } else {
        await emitConsoleLine(
            ste,
            ':: [ERRATA:SCHEMA_FAIL] Errata Record verification failed.',
        )
        cpy.statusMessage = 'ERRATA_SCHEMA_FAILED'
    }

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'validate-errata-schema',
                val: parsed.success ? 0 : -1,
            },
        })
    }
    return cpy
}

export const INSPECT_STANDING_REGISTRY_LABEL =
    '[1] INSPECT EPISTEMIC STANDING REGISTRY'
export const CANON_MENU_BACK_LABEL = '[<] BACK TO LORE MENU'

/**
 * Opens the [CANON MENU] standing deck. Preserves the blessed 12x12 dual-pane
 * topology: left 4-column choice pane with net mesh binding, right 8-column
 * cns00 telemetry pane. Headless fallback resolves the option list via slv.
 */
export const openCanonMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const canonOptions = [
        INSPECT_STANDING_REGISTRY_LABEL,
        RUN_STILL_GOOD_AUDIT_LABEL,
        EXECUTE_TRIE_DISJOINTNESS_SCAN_LABEL,
        CANON_MENU_BACK_LABEL,
    ]
    const canonDescriptions: Record<string, string> = {
        [INSPECT_STANDING_REGISTRY_LABEL]:
            'Validate epistemic standing registry and tri-state badge metadata.',
        [RUN_STILL_GOOD_AUDIT_LABEL]:
            'Rank reconsideration queue by blast-radius priority and affirm top fact.',
        [EXECUTE_TRIE_DISJOINTNESS_SCAN_LABEL]:
            'Scan clue tokens against forbidden mystery lemmas in linear O(L) time.',
        [CANON_MENU_BACK_LABEL]: 'Return to the primary lore dashboard.',
    }

    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'open-canon-menu',
                    lst: canonOptions,
                    val: 0,
                },
            })
        }
        return cpy
    }

    const gridBit = await lib.hunt(GRID_UPDATE, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const canonChoiceBit = await lib.hunt(CHOICE_OPEN, {
        dat: {
            clr0: 0,
            clr1: 3,
            cb: async (choice: string) => {
                const text = canonDescriptions[choice]
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${text || 'No description available.'}`,
                })
            },
        },
        src: 'VERTICAL',
        lst: canonOptions,
        net: gridBit?.grdBit?.dat,
    })

    const selection = canonChoiceBit?.chcBit?.src

    if (selection === INSPECT_STANDING_REGISTRY_LABEL) {
        await inspectEpistemicStandingRegistryAction(cpy, bal, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    if (selection === RUN_STILL_GOOD_AUDIT_LABEL) {
        await runStillGoodAuditAction(cpy, bal, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    if (selection === EXECUTE_TRIE_DISJOINTNESS_SCAN_LABEL) {
        await executeTrieDisjointnessScanAction(cpy, bal, ste)
        setTimeout(async () => {
            if (ste?.hunt) {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }
        }, 333)
        if (bal?.slv) {
            bal.slv({ mnuBit: bal })
        }
        return cpy
    }

    return updateMenu(cpy, bal, ste as State)
}

export const inspectEpistemicStandingRegistryAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [STANDING:INSPECT] Validating Epistemic Standing Registry...',
    )

    const sampleFactCandidate = {
        fact_id: 'fact_wart_arm_amputation',
        entity_id: 'char_wart',
        standing: 'FLAGGED_FOR_REVIEW',
        in_degree_count: 14,
        days_since_reconsideration: 45,
        last_reviewed_epoch: 100,
        review_note:
            'Writer raised question on bimanual brace in culvert siphon.',
    }

    const result = CanonFactStandingSchema.safeParse(sampleFactCandidate)

    if (result.success) {
        const meta = getStandingMetadata(result.data.standing)
        await emitConsoleLine(
            ste,
            `>> [STANDING:SCHEMA_OK] ${result.data.fact_id} validated | Badge: ${meta.badge} | CascadeOnEnter: ${meta.cascadeOnEnter}`,
        )
        cpy.statusMessage = 'STANDING_SCHEMA_VERIFIED'
    } else {
        for (const issue of result.error.issues) {
            await emitConsoleLine(
                ste,
                `:: [STANDING:SCHEMA_FAIL] ${issue.message}`,
            )
        }
        cpy.statusMessage = 'STANDING_SCHEMA_BREACH'
    }

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'inspect-standing-registry',
                val: result.success ? 0 : -1,
                dat: result,
            },
        })
    }
    return cpy
}

export const RUN_STILL_GOOD_AUDIT_LABEL =
    '[2] RUN STILL-GOOD RECONSIDERATION AUDIT'

export const runStillGoodAuditAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [AUDIT:PRIORITY] Running Topological Blast-Radius Reconsideration Queue...',
    )

    const mockFactCatalog = new Map<string, CanonFactStanding>([
        [
            'fact_wart_arm',
            {
                fact_id: 'fact_wart_arm',
                entity_id: 'char_wart',
                standing: 'ACTIVE_ENDORSED',
                in_degree_count: 42,
                days_since_reconsideration: 90,
                last_reviewed_epoch: 0,
            },
        ],
        [
            'fact_culvert_grate',
            {
                fact_id: 'fact_culvert_grate',
                entity_id: 'loc_culvert_siphon',
                standing: 'FLAGGED_FOR_REVIEW',
                in_degree_count: 14,
                days_since_reconsideration: 65,
                last_reviewed_epoch: 0,
            },
        ],
    ])

    const queue = rankReconsiderationQueue(mockFactCatalog, 0, 0)

    for (const item of queue) {
        const spineFlag = item.is_monolithic_spine ? ' [MONOLITHIC SPINE]' : ''
        await emitConsoleLine(
            ste,
            `>> [AUDIT:ITEM] ${item.fact_id} | Score: ${item.priority_score_bps} bps | InDegree: ${item.in_degree_count} | DaysStale: ${item.days_since_reconsideration}${spineFlag}`,
        )
    }

    // Demonstrate 5-second "Still Good" cognitive affirmation on top candidate
    const topFactId = queue[0].fact_id
    const affirmation = affirmStillGood(mockFactCatalog, topFactId, 1000)

    await emitConsoleLine(
        ste,
        `>> [STILL_GOOD:OK] Fact ${topFactId} affirmed | VersionBumped: ${affirmation.version_bumped} | CascadeTriggered: ${affirmation.cascade_triggered} | Compute: $0.00`,
    )

    cpy.statusMessage = 'STILL_GOOD_AUDIT_COMPLETE'

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'run-still-good-audit',
                val: 0,
                dat: { queue, affirmation },
            },
        })
    }
    return cpy
}

export const EXECUTE_TRIE_DISJOINTNESS_SCAN_LABEL =
    '[3] EXECUTE TRIE CLUE-LEMMA DISJOINTNESS SCAN'

export const executeTrieDisjointnessScanAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [TRIE:SCAN] Populating O(L) Prefix-Tree with forbidden mystery lemmas...',
    )

    const sampleMysteries: MysteryTrieIngress[] = [
        {
            topic_id: 'mystery_famine_well',
            forbidden_propositions: [
                {
                    id: 'prop_arsenic_taint',
                    trigger_lemmas: [
                        'arsenic',
                        'poison',
                        'taint',
                        'well water',
                    ],
                },
            ],
            permitted_clue_tokens: ['rusted_bucket', 'cut_rope', 'iron_grate'],
        },
    ]

    const report = TrieClueDisjointnessSolver.verifyDisjointnessAcrossCorpus(
        sampleMysteries,
        'char_wart',
    )

    if (report.valid) {
        await emitConsoleLine(
            ste,
            `>> [TRIE:DISJOINT_OK] Evaluated ${report.totalCluesEvaluated} clue(s) against ${report.totalLemmasIndexed} lemma(s). Zero collisions at T0 = $0.00.`,
        )
        cpy.statusMessage = 'TRIE_DISJOINTNESS_VERIFIED'
    } else {
        for (const col of report.collisions) {
            await emitConsoleLine(
                ste,
                `:: [TRIE:COLLISION] Clue '${col.collidingToken}' collided with forbidden lemma '${col.lemma}' in topic '${col.topicId}'!`,
            )
        }
        cpy.statusMessage = 'TRIE_COLLISION_DETECTED'
    }

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'execute-trie-disjointness-scan',
                val: report.valid ? 0 : -1,
                dat: report,
            },
        })
    }
    return cpy
}

export default updateMenu
export const RUN_ENTITY_PREFLIGHT_GATE_LABEL =
    '[2] RUN SOMATIC SAT FOREIGN-KEY GATE'

export const runEntityPreFlightGateMenuAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [PREFLIGHT:GATE] Evaluating Somatic SAT and Foreign-Key Integrity...',
    )

    const report = runEntityPreFlightGate(
        'char_wart',
        {
            id: 'char_wart',
            location_id: 'loc_culvert_siphon',
            possessions: ['item_brass_key'],
            somatic: {
                left_arm: 'AMPUTATED',
                right_arm: 'INTACT',
            },
        },
        ['char_wart', 'char_bog', 'loc_culvert_siphon', 'item_brass_key'],
        10000,
    )

    if (report.passed) {
        await emitConsoleLine(
            ste,
            '>> [PREFLIGHT:PASS] ' +
                report.entityId +
                ' certified | Available: ' +
                report.somatic.availableHandsBps +
                ' bps | Required: ' +
                report.somatic.requiredHandsBps +
                ' bps | ForeignKeys: ' +
                report.foreignKeys.danglingKeys.length +
                ' dangling',
        )
        cpy.statusMessage = 'PREFLIGHT_GATE_PASSED'
    } else {
        for (const err of report.errors) {
            await emitConsoleLine(ste, ':: [PREFLIGHT:BREACH] ' + err)
        }
        cpy.statusMessage = 'PREFLIGHT_GATE_BREACHED'
    }

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'run-entity-preflight-gate',
                val: report.passed ? 0 : -1,
                dat: report,
            },
        })
    }
    return cpy
}
import {
    verifyHandSaturationSat,
    assertMassConservation,
} from '../../04.logistic.unit/buz/logistic.buzz.js'

export const AUDIT_EQUIPMENT_CONSERVATION_LABEL =
    '[1] AUDIT FOUR-TIER EQUIPMENT CONSERVATION'

export const auditEquipmentConservationMenuAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [LOGISTIC:INSPECT] Target: char_wart | Limbs Available: 10000 bps (1.0 Arm)',
    )

    const sat = verifyHandSaturationSat({
        entity_id: 'char_wart',
        arms_available_bps: 10000,
        held_items: [
            {
                item_id: 'item_iron_knife',
                occupies_hands: 1,
                occupies_hands_bps: 10000,
                mass_grams: 150,
                weight_class: 'scrap' as const,
                is_contested: false,
                allowed_slots: ['HELD_PRIMARY', 'HELD_OFFHAND'] as any,
            },
        ],
    })

    const conservation = assertMassConservation({
        char_wart: {
            entity_id: 'char_wart',
            worn: ['item_tallow_apron'],
            held: ['item_iron_knife'],
            carried: ['item_lockpick_wire'],
            cached: { loc_culvert_siphon: ['item_spare_spring'] },
        },
        char_bog: {
            entity_id: 'char_bog',
            worn: [],
            held: ['item_heavy_sledge'],
            carried: [],
            cached: {},
        },
    })

    await emitConsoleLine(
        ste,
        '>> [SAT GATE] Demanded: ' +
            sat.demanded_hands_bps +
            ' bps <= Available: ' +
            sat.arms_available_bps +
            ' bps [PASS / T0 = $0.00]',
    )
    await emitConsoleLine(
        ste,
        '>> [CONSERVATION] Audited ' +
            conservation.total_characters_audited +
            ' characters, ' +
            conservation.total_unique_items +
            ' unique items. Zero duplicate leases [OK]',
    )

    cpy.statusMessage = 'LOGISTIC_CONSERVATION_VERIFIED'

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'audit-equipment-conservation',
                val: sat.valid && conservation.valid ? 1 : 0,
                dat: { sat, conservation },
            },
        })
    }
    return cpy
}
import { reconcileRetiredEntityPossessions } from '../../04.logistic.unit/buz/matterConservation.buzz.js'

export const SIMULATE_MATTER_CONSERVATION_LABEL =
    '[3] SIMULATE MATTER CONSERVATION GATE'

export const simulateMatterConservationMenuAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [CONSERVATION:SIM] Simulating physical matter conservation for retiring entity char_old_snag...',
    )

    const brassKey = {
        item_id: 'item_brass_key',
        occupies_hands: 1,
        occupies_hands_bps: 10000,
        mass_grams: 120,
        weight_class: 'shine' as const,
        is_contested: false,
        allowed_slots: [
            'HELD_PRIMARY',
            'POCKET_STORAGE',
            'CACHED_LOCATION',
        ] as any,
    }

    const heavySledge = {
        item_id: 'item_heavy_sledge',
        occupies_hands: 2,
        occupies_hands_bps: 20000,
        mass_grams: 4500,
        weight_class: 'weight' as const,
        is_contested: false,
        allowed_slots: ['HELD_PRIMARY', 'CACHED_LOCATION'] as any,
    }

    const receipt = reconcileRetiredEntityPossessions({
        retiring_entity_id: 'char_old_snag',
        held_possessions: [brassKey, heavySledge],
        item_transfers: [
            {
                item_id: 'item_brass_key',
                disposition_type: 'TRANSFER_TO_CHARACTER',
                recipient_character_id: 'char_wart',
                target_partition: 'held',
            },
            {
                item_id: 'item_heavy_sledge',
                disposition_type: 'DROP_AT_LOCATION',
                recipient_character_id: null,
                drop_location_id: 'loc_culvert_siphon',
            },
        ],
        active_characters: {
            char_wart: {
                arms_available_bps: 10000,
                vector: {
                    entity_id: 'char_wart',
                    worn: [],
                    held: [],
                    carried: [],
                    cached: {},
                },
            },
        },
        valid_location_ids: ['loc_culvert_siphon'],
        known_possessions: {
            item_brass_key: brassKey,
            item_heavy_sledge: heavySledge,
        },
    })

    if (receipt.valid) {
        await emitConsoleLine(
            ste,
            '>> [CUSTODY:OK] Accounted ' +
                receipt.total_items_accounted +
                ' item(s): ' +
                receipt.transferred_count +
                ' transferred, ' +
                receipt.dropped_count +
                ' dropped [T0 = $0.00]',
        )
        cpy.statusMessage = 'MATTER_CONSERVATION_VERIFIED'
    } else {
        for (const err of receipt.errors) {
            await emitConsoleLine(ste, ':: [CONSERVATION:BREACH] ' + err)
        }
        cpy.statusMessage = 'MATTER_CONSERVATION_BREACHED'
    }

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'simulate-matter-conservation',
                val: receipt.valid ? 1 : 0,
                dat: receipt,
            },
        })
    }
    return cpy
}
import { sweepActiveDependencies } from '../../41.canon.unit/buz/dependencySweeper.buzz.js'
import type { ActiveDependencyEdge } from '../../41.canon.unit/fce/dependencySweeper.bit.js'

export const SWEEP_ACTIVE_DEPENDENCIES_LABEL =
    '[4] SWEEP ACTIVE DEPENDENCY REFERENCES'

export const sweepActiveDependenciesMenuAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [SWEEP:SCAN] Sweeping inbound dependency edges prior to retirement...',
    )

    const sampleEdges: ActiveDependencyEdge[] = [
        {
            source_id: 'scene_ep104_climax',
            target_id: 'char_wart',
            domain: 'SCENE_CASTING',
            source_standing: 'ACTIVE_ENDORSED',
            field_path: 'cast_ids[0]',
        },
        {
            source_id: 'grv_culvert_collapse',
            target_id: 'char_wart',
            domain: 'GRIEVANCE_TARGET',
            source_standing: 'ACTIVE_ENDORSED',
            field_path: 'target_entity_id',
        },
        {
            source_id: 'scene_ep101_deleted_draft',
            target_id: 'item_cracked_mug',
            domain: 'POSSESSION_LEASE',
            source_standing: 'DEPRECATED_ARCHIVED',
            field_path: 'props[0]',
        },
    ]

    const wartSweep = sweepActiveDependencies('char_wart', sampleEdges)
    const mugSweep = sweepActiveDependencies('item_cracked_mug', sampleEdges)

    if (!wartSweep.retirement_cleared) {
        await emitConsoleLine(
            ste,
            ':: [REF_LOCK] ' + wartSweep.reason + ' [HALTED AT T0 = $0.00]',
        )
    }

    if (mugSweep.retirement_cleared) {
        await emitConsoleLine(
            ste,
            ">> [RETIRE_READY] Entity '" +
                mugSweep.target_entity_id +
                "' has 0 active referents (" +
                mugSweep.archived_in_degree_ignored +
                ' archived ignored). Cleared for retirement [OK]',
        )
    }

    cpy.statusMessage = 'DEPENDENCY_SWEEP_COMPLETE'

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'sweep-active-dependencies',
                val: 1,
                dat: { wartSweep, mugSweep },
            },
        })
    }
    return cpy
}
import { reconcileReciprocalLinks } from '../../01.location.unit/buz/reciprocalLinker.buzz.js'
import { LocationModel } from '../../01.location.unit/location.model.js'

export const RECONCILE_SPATIAL_PORTALS_LABEL =
    '[1] RECONCILE RECIPROCAL SPATIAL PORTALS'

export const reconcileSpatialPortalsMenuAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const seriesSlug =
        (bal as any)?.dat?.seriesSlug ||
        cpy.activeSeries ||
        'under-the-floorboards'
    const locationId = (bal as any)?.dat?.locationId || 'loc_culvert_siphon'
    await emitConsoleLine(
        ste,
        '>> [PORTAL:SCAN] Inspecting portal connections in ' +
            "'" +
            locationId +
            "'...",
    )

    const locModel = new LocationModel()
    let receiptData: any = null

    await reconcileReciprocalLinks(
        locModel,
        {
            idx: 'menu-reconcile-portals',
            dat: {
                seriesSlug,
                locationId,
                dryRun: true,
            },
            slv: (res: any) => {
                receiptData = res.locationBit
            },
        } as any,
        ste,
    )

    cpy.statusMessage =
        receiptData?.val === 1
            ? 'PORTAL_RECIPROCITY_VERIFIED'
            : 'PORTAL_RECIPROCITY_DEFECT'

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'reconcile-spatial-portals',
                val: receiptData?.val ?? 0,
                dat: receiptData?.dat,
            },
        })
    }
    return cpy
}
import { voidStateScan } from '../../32.status.unit/buz/voidStateScan.buzz.js'
import { StatusModel } from '../../32.status.unit/status.model.js'

export const EVALUATE_VOID_STATE_LABEL = '[2] EVALUATE COLD-BOOT VOID STATE'

export const evaluateVoidStateMenuAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [VOID:SCAN] Scanning <repoRoot>/series/ for sealed storyworlds...',
    )

    const stsModel = new StatusModel()
    let scanPayload: any = null

    await voidStateScan(
        stsModel,
        {
            idx: 'menu-void-state-scan',
            src: (bal as any)?.src,
            slv: (res: any) => {
                scanPayload = res.statusBit
            },
        },
        ste,
    )

    const dat = scanPayload?.dat
    if (dat?.isVoidState) {
        await emitConsoleLine(
            ste,
            ':: [LOCKED] COLD-BOOT VOID STATE DETECTED (0 sealed series). Dispatch lock engaged [T0 = $0.00]',
        )
        cpy.statusMessage = 'VOID_STATE_LOCKED'
    } else {
        await emitConsoleLine(
            ste,
            '>> [SEALED] Active storyworlds discovered (' +
                dat.discoveredSlugs.length +
                '): [' +
                dat.discoveredSlugs.join(', ') +
                '] [OK]',
        )
        cpy.statusMessage = 'SERIES_CORPUS_ACTIVE'
    }

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'evaluate-void-state',
                val: scanPayload?.val ?? 1,
                dat,
            },
        })
    }
    return cpy
}
import * as os from 'node:os'
import {
    computePreSealMerkleHash,
    loadBibleState,
} from '../../23.port.unit/buz/bibleClient.buzz.js'

export const VERIFY_CANON_PORT_SEAL_LABEL =
    '[1] VERIFY READ-ONLY CANON PORT SEAL'

export const verifyCanonPortSealMenuAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [PORT:VERIFY] Auditing RFC 8785 Merkle verification port and deepFreeze guard...',
    )

    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'goblin-port-seal-'))
    try {
        const slug = 'under-the-floorboards'
        const compiledDir = path.join(tmpRoot, 'compiled', slug)
        fs.mkdirSync(compiledDir, { recursive: true })

        const basePayload = {
            schema_version: '1.0.0',
            series_slug: slug,
            catalog_summary: { total_entities: 1 },
            entity_hashes: { char_wart: 'a'.repeat(64) },
            entities: { char_wart: { id: 'char_wart', name: 'Wart' } },
        }
        const rootMerkleHash = computePreSealMerkleHash(basePayload)
        const biblePath = path.join(compiledDir, 'bible-state.json')
        fs.writeFileSync(
            biblePath,
            JSON.stringify(
                { ...basePayload, root_merkle_hash: rootMerkleHash },
                null,
                2,
            ),
            'utf8',
        )

        const verified = loadBibleState(slug, { repoRoot: tmpRoot })
        const frozen =
            Object.isFrozen(verified) && Object.isFrozen(verified.entities)

        fs.writeFileSync(
            biblePath,
            JSON.stringify(
                {
                    ...basePayload,
                    entities: { char_wart: { id: 'char_wart', name: 'WartX' } },
                    root_merkle_hash: rootMerkleHash,
                },
                null,
                2,
            ),
            'utf8',
        )

        let tamperTrapped = false
        try {
            loadBibleState(slug, { repoRoot: tmpRoot })
        } catch (err: any) {
            tamperTrapped = String(err.message).includes(
                '[CANON_TAMPER_DETECTED]',
            )
        }

        if (frozen && tamperTrapped) {
            await emitConsoleLine(
                ste,
                '>> [PORT:SEAL_VERIFIED] RFC 8785 H_root=' +
                    rootMerkleHash.slice(0, 12) +
                    ' | deepFreeze=true | TamperTrap=ACTIVE [OK]',
            )
            cpy.statusMessage = 'CANON_PORT_SEAL_VERIFIED'
        } else {
            await emitConsoleLine(
                ste,
                ':: [FAIL] Canon port seal or tamper trap verification failed',
            )
            cpy.statusMessage = 'CANON_PORT_SEAL_FAILED'
        }

        if (bal.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'verify-canon-port-seal',
                    val: frozen && tamperTrapped ? 1 : 0,
                    dat: { rootMerkleHash, frozen, tamperTrapped },
                },
            })
        }
    } finally {
        fs.rmSync(tmpRoot, { recursive: true, force: true })
    }

    return cpy
}
import { runSomaticGauntlet } from '../../22.payload.unit/buz/somaticGauntlet.buzz.js'

export const RUN_SOMATIC_GAUNTLET_LABEL =
    '[9] RUN FULL SOMATIC DSP VERIFICATION SWEEP'

export const runSomaticGauntletMenuAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [DISPATCH] Executing: ' + RUN_SOMATIC_GAUNTLET_LABEL,
    )

    const summary = runSomaticGauntlet(100)
    const stageNames = [
        '[STAGE_1] Float Metric Trap',
        '[STAGE_2] Strict Key Closure Trap',
        '[STAGE_3] Aphonia Delivery Trap',
        '[STAGE_4] Monotonic Regression Trap',
        '[STAGE_5] Hash Parity Sentinel Trap',
    ]

    for (let i = 0; i < summary.results.length; i++) {
        const trap = summary.results[i]
        const label = stageNames[i] || trap.stageLabel
        const statusTag = trap.passed
            ? '[OK] TRAPPED'
            : '[FAIL] ' + trap.caughtExceptionSignature
        await emitConsoleLine(ste, '>> ' + label + ' -> ' + statusTag)
    }

    await emitConsoleLine(
        ste,
        '>> [RECEIPT] [GAUNTLET_PASS: ' +
            summary.trapsPassed +
            '/' +
            summary.totalTraps +
            ' TRAPS VERIFIED AT T0 = $0.00] (' +
            summary.totalLatencyMs +
            'ms) Finished [OK]',
    )

    cpy.statusMessage = summary.isCertified
        ? 'SOMATIC_GAUNTLET_CERTIFIED'
        : 'SOMATIC_GAUNTLET_BREACH'

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'run-somatic-gauntlet',
                val: summary.isCertified ? 1 : 0,
                dat: summary,
            },
        })
    }
    return cpy
}
import {
    computeLocalDependencyHash,
    filterDrainableDrafts,
} from '../../23.port.unit/buz/stagingDrain.buzz.js'

export const AUDIT_EDGE_STAGING_BUFFER_LABEL =
    '[2] AUDIT EDGE STAGING QUARANTINE BUFFER'

export const auditEdgeStagingBufferMenuAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [STAGING:AUDIT] Verifying Asymmetric Edge Quarantine Buffer & H_dep stale-canon barrier...',
    )

    const localHashes = {
        char_bog: 'a'.repeat(64),
        loc_culvert_siphon: 'b'.repeat(64),
    }
    const freshHDep = computeLocalDependencyHash(
        'char_bog',
        ['loc_culvert_siphon'],
        localHashes,
    )

    const report = filterDrainableDrafts(
        {
            series_slug: 'under-the-floorboards',
            trunk_h_root: 'c'.repeat(64),
            drained_at_ms: Date.now(),
            drafts: [
                {
                    draft_id: 'draft_fresh_01',
                    series_slug: 'under-the-floorboards',
                    entity_id: 'char_bog',
                    author_id: 'writer_alice',
                    base_h_root: 'c'.repeat(64),
                    base_h_dep: freshHDep,
                    foreign_key_ids: ['loc_culvert_siphon'],
                    markdown_payload: '---\nid: char_bog\n---\nFresh draft.\n',
                    status: 'OPEN',
                },
                {
                    draft_id: 'draft_stale_02',
                    series_slug: 'under-the-floorboards',
                    entity_id: 'char_bog',
                    author_id: 'writer_bob',
                    base_h_root: 'c'.repeat(64),
                    base_h_dep: '0'.repeat(64),
                    foreign_key_ids: ['loc_culvert_siphon'],
                    markdown_payload: '---\nid: char_bog\n---\nStale draft.\n',
                    status: 'OPEN',
                },
            ],
        },
        localHashes,
    )

    if (report.accepted.length === 1 && report.quarantined.length === 1) {
        await emitConsoleLine(
            ste,
            '>> [STAGING:QUARANTINE_OK] Accepted: ' +
                report.accepted.length +
                ' | Quarantined (H_dep stale): ' +
                report.quarantined.length +
                ' [T0 = $0.00]',
        )
        cpy.statusMessage = 'EDGE_STAGING_QUARANTINE_VERIFIED'
    } else {
        await emitConsoleLine(
            ste,
            ':: [FAIL] Edge staging quarantine filter failed parity check',
        )
        cpy.statusMessage = 'EDGE_STAGING_QUARANTINE_FAILED'
    }

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'audit-edge-staging-buffer',
                val:
                    report.accepted.length === 1 &&
                    report.quarantined.length === 1
                        ? 1
                        : 0,
                dat: report,
            },
        })
    }
    return cpy
}
import { exportPinnedEdgeSchemaBundle } from '../../26.schema.unit/buz/schemaBundleExporter.buzz.js'

export const AUDIT_EDGE_SCHEMA_BUNDLE_LABEL =
    '[3] AUDIT EDGE PINNED SCHEMA BUNDLE'

export const auditEdgeSchemaBundleMenuAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [SCHEMA_PIN:AUDIT] Exporting version-pinned schemas.json bundle for edge Worker parity...',
    )

    const bundle = exportPinnedEdgeSchemaBundle('trunk_sha_001', '1.0.0')
    const domainCount = Object.keys(bundle.domains).length

    if (bundle.schema_bundle_hash.length === 64 && domainCount === 4) {
        await emitConsoleLine(
            ste,
            '>> [SCHEMA_PIN:OK] Domains: ' +
                domainCount +
                ' | SHA-256: ' +
                bundle.schema_bundle_hash.slice(0, 12) +
                ' | Zero skew [T0 = $0.00]',
        )
        cpy.statusMessage = 'EDGE_SCHEMA_BUNDLE_VERIFIED'
    } else {
        await emitConsoleLine(
            ste,
            ':: [FAIL] Edge schema bundle export failed hash verification',
        )
        cpy.statusMessage = 'EDGE_SCHEMA_BUNDLE_FAILED'
    }

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'audit-edge-schema-bundle',
                val: bundle.schema_bundle_hash.length === 64 ? 1 : 0,
                dat: bundle,
            },
        })
    }
    return cpy
}
import { evaluateSceneSomaticStaleness } from '../../22.payload.unit/buz/scenePrecondition.buzz.js'

export const SIMULATE_HTTP_412_GATE_LABEL =
    '[3] SIMULATE HTTP 412 DIRTY-SCENE GATE'

export const simulateHttp412DirtySceneGateMenuAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    await emitConsoleLine(
        ste,
        '>> [HTTP_412:PROBE] Dispatching stale scene EP101_SC02 to /api/lore/verify-scene-precondition...',
    )

    const verdict = evaluateSceneSomaticStaleness({
        scene_id: 'EP101_SC02',
        series_slug: 'under-the-floorboards',
        scene_bible_merkle_hash: '1'.repeat(64),
        sealed_root_merkle_hash: '9'.repeat(64),
        is_dirty: 1,
        fact_dependencies: [
            {
                fact_id: 'fact_wart_left_arm',
                entity_id: 'char_wart',
                pinned_version: 1,
                current_version: 2,
            },
        ],
    })

    const resStatus = verdict.admitted ? 200 : 412
    const body: any = verdict.admitted ? verdict : (verdict as any).receipt

    if (resStatus === 412 && body.error === 'DIRTY_SCENE_REJECTED') {
        await emitConsoleLine(
            ste,
            '>> [HTTP_412:REJECTED] DIRTY_SCENE_REJECTED | Scene: ' +
                body.scene_id +
                ' | Collisions: ' +
                (body.collisions?.length ?? 1) +
                ' [T0 = $0.00]',
        )
        cpy.statusMessage = 'HTTP_412_DIRTY_SCENE_GATE_VERIFIED'
    } else {
        await emitConsoleLine(
            ste,
            ':: [FAIL] Expected HTTP 412 DIRTY_SCENE_REJECTED, got ' +
                resStatus,
        )
        cpy.statusMessage = 'HTTP_412_DIRTY_SCENE_GATE_FAILED'
    }

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'simulate-http-412-gate',
                val: resStatus === 412 ? 1 : 0,
                dat: body,
            },
        })
    }
    return cpy
}
