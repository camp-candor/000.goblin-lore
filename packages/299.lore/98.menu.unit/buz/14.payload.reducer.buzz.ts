/* eslint-disable */
/**
 * packages/299.lore/98.menu.unit/buz/14.payload.reducer.buzz.ts
 *
 * Interactive Payload Serialization Reducer Console for the Somatic DSP
 * Modulation Hub. Drives 22.payload.unit reducer action dispatch pipeline and
 * model inspection, streaming 7-bit ASCII receipts into the cns00 console pane.
 */

import { PayloadModel } from '../../22.payload.unit/payload.model.js'
import { reducer } from '../../22.payload.unit/payload.reduce.js'
import * as Act from '../../22.payload.unit/payload.action.js'
import { PRESET_LINE_WART_001 } from './10.payload.validator.buzz.js'
import type { VocalFeasibilityCandidate } from '../../22.payload.unit/val/aphoniaGate.val.js'
import type { StalenessEvaluationInput } from '../../22.payload.unit/val/factPinning.val.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export const REDUCER_BACK_LABEL = '[<] BACK'
export const REDUCER_OPTIONS = [
    '[Run Full Pipeline Dispatch]',
    '[Dispatch Validate]',
    '[Dispatch Feasibility]',
    '[Dispatch Staleness]',
    '[Dispatch Hash]',
    '[Inspect Model State]',
    REDUCER_BACK_LABEL,
]

export const WART_CANDIDATE: VocalFeasibilityCandidate = {
    entityId: 'char_wart',
    verbatimText: PRESET_LINE_WART_001.verbatimText,
    activeConditions: ['cnd_severed_left_arm'],
    bannedKineticVerbs: ['bimanual_lift'],
    isNonVerbalExpression: false,
}

export const WART_STALENESS_INPUT: StalenessEvaluationInput = {
    sceneId: 'sc_culvert_siphon_01',
    pinnedFacts: [
        {
            factId: 'fact_wart_arm_severed',
            pinnedVersion: 3,
            pinnedHash: 'a'.repeat(64),
            claimText: 'Wart severed left arm.',
            scope: 'CHARACTER',
        },
    ],
    liveLedgerFacts: {
        fact_wart_arm_severed: {
            factId: 'fact_wart_arm_severed',
            currentVersion: 3,
            contentHash: 'a'.repeat(64),
            claimText: 'Wart severed left arm.',
            isRetired: false,
        },
    },
}

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

export const runPayloadReducerConsoleMenu = async (
    _ste: any,
): Promise<void> => {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        return
    }

    let model = new PayloadModel()
    const captureShim = {
        hunt: async (_action: string, payload: any) => {
            await lib.hunt(UPDATE_CONSOLE, payload)
        },
    }

    for (;;) {
        const choice = await openChoice(
            lib,
            REDUCER_OPTIONS,
            '[PAYLOAD_REDUCER:DISPATCH]',
        )

        if (!choice || choice === REDUCER_BACK_LABEL) {
            return
        }

        if (choice === '[Run Full Pipeline Dispatch]') {
            // 1. Validate TTS Payload
            model = reducer(
                model,
                new Act.ValidateTtsPayload({
                    idx: 'val-line_wart_001',
                    dat: { candidatePayload: PRESET_LINE_WART_001 },
                }),
                captureShim as any,
            )

            // 2. Verify Vocal Feasibility
            model = reducer(
                model,
                new Act.VerifyVocalFeasibility({
                    idx: 'feas-line_wart_001',
                    dat: { candidate: WART_CANDIDATE, epoch: 0 },
                }),
                captureShim as any,
            )

            // 3. Check Scene Somatic Staleness
            model = reducer(
                model,
                new Act.CheckSceneSomaticStaleness({
                    idx: 'stale-line_wart_001',
                    dat: { stalenessInput: WART_STALENESS_INPUT, epoch: 0 },
                }),
                captureShim as any,
            )

            // 4. Hash TTS Generation Payload
            model = reducer(
                model,
                new Act.HashTtsGenerationPayload({
                    idx: 'hash-line_wart_001',
                    dat: { hashPayload: PRESET_LINE_WART_001, epoch: 0 },
                }),
                captureShim as any,
            )
        } else if (choice === '[Dispatch Validate]') {
            model = reducer(
                model,
                new Act.ValidateTtsPayload({
                    idx: 'val-line_wart_001',
                    dat: { candidatePayload: PRESET_LINE_WART_001 },
                }),
                captureShim as any,
            )
        } else if (choice === '[Dispatch Feasibility]') {
            model = reducer(
                model,
                new Act.VerifyVocalFeasibility({
                    idx: 'feas-line_wart_001',
                    dat: { candidate: WART_CANDIDATE, epoch: 0 },
                }),
                captureShim as any,
            )
        } else if (choice === '[Dispatch Staleness]') {
            model = reducer(
                model,
                new Act.CheckSceneSomaticStaleness({
                    idx: 'stale-line_wart_001',
                    dat: { stalenessInput: WART_STALENESS_INPUT, epoch: 0 },
                }),
                captureShim as any,
            )
        } else if (choice === '[Dispatch Hash]') {
            model = reducer(
                model,
                new Act.HashTtsGenerationPayload({
                    idx: 'hash-line_wart_001',
                    dat: { hashPayload: PRESET_LINE_WART_001, epoch: 0 },
                }),
                captureShim as any,
            )
        } else if (choice === '[Inspect Model State]') {
            const valList = Object.keys(model.validatedPayloads).join(', ')
            const feasList = Object.keys(model.feasibilityReceipts).join(', ')
            const staleList = Object.keys(model.stalenessReceipts).join(', ')
            const hashList = Object.keys(model.hashedPayloads).join(', ')

            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [MODEL_STATE] totalValidatedCount: ${model.totalValidatedCount} | validatedPayloads: [${valList}] | feasibilityReceipts: [feasList] | stalenessReceipts: [${staleList}] | hashedPayloads: [${hashList}] [OK]`,
            })
        } else {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: [PAYLOAD_REDUCER] Unknown dispatch option: ${choice}`,
            })
        }
    }
}
