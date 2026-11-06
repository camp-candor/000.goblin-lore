/* eslint-disable */
/**
 * packages/299.lore/98.menu.unit/buz/12.fact.staleness.buzz.ts
 *
 * Interactive Monotonic Fact Staleness Checker for the Somatic DSP
 * Modulation Hub. Drives 22.payload.unit dependency pinning assertions and
 * streams 7-bit ASCII receipts into the cns00 console pane.
 */

import { PayloadModel } from '../../22.payload.unit/payload.model.js'
import { checkSceneSomaticStaleness } from '../../22.payload.unit/payload.buzzer.js'
import type { StalenessEvaluationInput } from '../../22.payload.unit/val/factPinning.val.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export const STALENESS_BACK_LABEL = '[<] BACK'
export const STALENESS_SCENE_OPTIONS = [
    'sc_culvert_siphon_02',
    'sc_boiler_flue_01',
]

export const CLEAN_SCENE_CULVERT_SIPHON_02: StalenessEvaluationInput = {
    sceneId: 'sc_culvert_siphon_02',
    pinnedFacts: [
        {
            factId: 'fact_wart_arm_severed',
            pinnedVersion: 2,
            pinnedHash: 'a'.repeat(64),
            claimText: 'Wart severed left arm below elbow.',
        },
        {
            factId: 'fact_boiler_flue_intact',
            pinnedVersion: 1,
            pinnedHash: 'b'.repeat(64),
            claimText: 'Boiler flue intact.',
        },
    ],
    liveLedgerFacts: {
        fact_wart_arm_severed: {
            factId: 'fact_wart_arm_severed',
            currentVersion: 2,
            contentHash: 'a'.repeat(64),
            claimText: 'Wart severed left arm below elbow.',
            isRetired: false,
        },
        fact_boiler_flue_intact: {
            factId: 'fact_boiler_flue_intact',
            currentVersion: 1,
            contentHash: 'b'.repeat(64),
            claimText: 'Boiler flue intact.',
            isRetired: false,
        },
    },
}

export const MUTATED_SCENE_CULVERT_SIPHON_02: StalenessEvaluationInput = {
    sceneId: 'sc_culvert_siphon_02',
    pinnedFacts: [
        {
            factId: 'fact_wart_arm_severed',
            pinnedVersion: 2,
            pinnedHash: 'a'.repeat(64),
            claimText: 'Wart severed left arm below elbow.',
        },
        {
            factId: 'fact_boiler_flue_intact',
            pinnedVersion: 1,
            pinnedHash: 'b'.repeat(64),
            claimText: 'Boiler flue intact.',
        },
    ],
    liveLedgerFacts: {
        fact_wart_arm_severed: {
            factId: 'fact_wart_arm_severed',
            currentVersion: 3,
            contentHash: 'c'.repeat(64),
            claimText: 'Wart left arm amputated at shoulder joint.',
            isRetired: false,
        },
        fact_boiler_flue_intact: {
            factId: 'fact_boiler_flue_intact',
            currentVersion: 1,
            contentHash: 'b'.repeat(64),
            claimText: 'Boiler flue intact.',
            isRetired: false,
        },
    },
}

export const CLEAN_SCENE_BOILER_FLUE_01: StalenessEvaluationInput = {
    sceneId: 'sc_boiler_flue_01',
    pinnedFacts: [
        {
            factId: 'fact_boiler_flue_intact',
            pinnedVersion: 1,
            pinnedHash: 'b'.repeat(64),
            claimText: 'Boiler flue intact.',
        },
    ],
    liveLedgerFacts: {
        fact_boiler_flue_intact: {
            factId: 'fact_boiler_flue_intact',
            currentVersion: 1,
            contentHash: 'b'.repeat(64),
            claimText: 'Boiler flue intact.',
            isRetired: false,
        },
    },
}

export const SCENARIO_CLEAN_LABEL = 'Matching Pinned Versions (Clean)'
export const SCENARIO_MUTATED_LABEL =
    'Upstream Mutation (fact_wart_arm_severed v3)'

async function openChoice(
    lib: any,
    lst: string[],
    hint: string,
): Promise<string | undefined> {
    const gridBit = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })
    const choiceBit = await lib.hunt(OPEN_CHOICE, {
        dat: {
            clr0: 0,
            clr1: 3,
            cb: (choice: string) => {
                lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `:: ${hint}: ${choice}`,
                })
            },
        },
        src: 'VERTICAL',
        lst,
        net: gridBit?.grdBit?.dat,
    })
    return choiceBit?.chcBit?.src
}

export const runFactStalenessCheckerMenu = async (_ste: any): Promise<void> => {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        return
    }

    const model = new PayloadModel()
    const captureShim = {
        hunt: async (_action: string, payload: any) => {
            await lib.hunt(UPDATE_CONSOLE, payload)
        },
    }

    let nextScene: string | undefined
    let culvertInvocationCount = 0

    for (;;) {
        let sceneChoice = nextScene
        nextScene = undefined

        if (!sceneChoice) {
            sceneChoice = await openChoice(
                lib,
                [...STALENESS_SCENE_OPTIONS, STALENESS_BACK_LABEL],
                '[STALENESS:SCENE]',
            )
        }

        if (!sceneChoice || sceneChoice === STALENESS_BACK_LABEL) {
            return
        }

        if (sceneChoice === 'sc_culvert_siphon_02') {
            const scenarioChoice = await openChoice(
                lib,
                [
                    SCENARIO_CLEAN_LABEL,
                    SCENARIO_MUTATED_LABEL,
                    STALENESS_BACK_LABEL,
                ],
                '[STALENESS:SCENARIO]',
            )

            if (!scenarioChoice || scenarioChoice === STALENESS_BACK_LABEL) {
                continue
            }

            if (STALENESS_SCENE_OPTIONS.includes(scenarioChoice)) {
                // If caller queued the next scene directly without scenario choice
                const payload =
                    culvertInvocationCount === 0
                        ? CLEAN_SCENE_CULVERT_SIPHON_02
                        : MUTATED_SCENE_CULVERT_SIPHON_02
                culvertInvocationCount++
                checkSceneSomaticStaleness(
                    model,
                    {
                        idx: `staleness-${payload.sceneId}`,
                        dat: payload,
                    } as any,
                    captureShim as any,
                )
                nextScene = scenarioChoice
                continue
            }

            const isMutated =
                scenarioChoice === SCENARIO_MUTATED_LABEL ||
                scenarioChoice.includes('Mutation') ||
                scenarioChoice.includes('v3') ||
                culvertInvocationCount > 0

            const payload = isMutated
                ? MUTATED_SCENE_CULVERT_SIPHON_02
                : CLEAN_SCENE_CULVERT_SIPHON_02

            culvertInvocationCount++

            checkSceneSomaticStaleness(
                model,
                { idx: `staleness-${payload.sceneId}`, dat: payload } as any,
                captureShim as any,
            )
        } else if (sceneChoice === 'sc_boiler_flue_01') {
            checkSceneSomaticStaleness(
                model,
                {
                    idx: `staleness-${CLEAN_SCENE_BOILER_FLUE_01.sceneId}`,
                    dat: CLEAN_SCENE_BOILER_FLUE_01,
                } as any,
                captureShim as any,
            )
        } else {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: [STALENESS] Unknown scene option: ${sceneChoice}`,
            })
        }
    }
}
