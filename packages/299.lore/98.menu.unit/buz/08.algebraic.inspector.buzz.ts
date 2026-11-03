/* eslint-disable */
/**
 * packages/299.lore/98.menu.unit/buz/08.algebraic.inspector.buzz.ts
 *
 * Interactive Algebraic DSP Matrix Inspector for the Somatic DSP
 * Modulation Hub. Drives 14.intensity.unit dynamic algebraic DSP
 * composition (pitch/formant/velocity, quadratic breath dilation,
 * vocal fry density, motor collapse gate) and streams 7-bit ASCII
 * receipts into the cns00 console pane.
 */

import { IntensityModel } from '../../14.intensity.unit/intensity.model.js'
import { composeAlgebraicDspMatrix } from '../../14.intensity.unit/intensity.buzzer.js'
import type { ComposedSomaticDspMatrix } from '../../14.intensity.unit/val/algebraicDsp.val.js'
import type { VocalDspModifierProfile } from '../../37.trauma.unit/val/vocalDsp.val.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export const MATRIX_BACK_LABEL = '[<] BACK'
export const MATRIX_ENTITY_IDS = ['char_wart', 'char_bog', 'char_spleen']

export const MATRIX_PILOT_SCENARIO_LABEL =
    'Pilot Case: fatigue 8200, pain 7500 [CRAWL, SPEAK]'
export const MATRIX_CONFLICT_SCENARIO_LABEL =
    'Motor Collapse Conflict: append RUN at fatigue 8200'

export const MATRIX_SCENARIO_LABELS = [
    MATRIX_PILOT_SCENARIO_LABEL,
    MATRIX_CONFLICT_SCENARIO_LABEL,
]

const PILOT_FATIGUE_BPS = 8200
const PILOT_PAIN_BPS = 7500
const PILOT_PARANOIA_BPS = 0
const PILOT_BASE_ACTIONS = ['CRAWL', 'SPEAK']

function neutralBaselineFor(entityId: string): VocalDspModifierProfile {
    return {
        entityId,
        pitchShiftCentitones: 0,
        formantWarpingBps: 10000,
        speedMultiplierBps: 10000,
        breathinessPauseMultiplierBps: 10000,
        vocalFryDensityBps: 0,
        hasLaryngealTrauma: false,
        hasPulmonaryTrauma: false,
        bannedCadences: [],
        matchedAcousticConditions: [],
    }
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

async function emitLine(lib: any, src: string): Promise<void> {
    await lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src })
}

export const runAlgebraicDspInspectorMenu = async (
    _ste: any,
): Promise<void> => {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        return
    }

    const selectedEntity = await openChoice(
        lib,
        [...MATRIX_ENTITY_IDS, MATRIX_BACK_LABEL],
        '[MATRIX:ENTITY]',
    )
    if (!selectedEntity || selectedEntity === MATRIX_BACK_LABEL) {
        return
    }

    const model = new IntensityModel()
    const steShim = {
        hunt: async (action: string, payload: any) => lib.hunt(action, payload),
    }

    for (;;) {
        const scenarioChoice = await openChoice(
            lib,
            [...MATRIX_SCENARIO_LABELS, MATRIX_BACK_LABEL],
            '[MATRIX:SCENARIO]',
        )
        if (!scenarioChoice || scenarioChoice === MATRIX_BACK_LABEL) {
            return
        }

        let proposedMotorActions: string[]
        if (scenarioChoice === MATRIX_PILOT_SCENARIO_LABEL) {
            proposedMotorActions = [...PILOT_BASE_ACTIONS]
        } else if (scenarioChoice === MATRIX_CONFLICT_SCENARIO_LABEL) {
            proposedMotorActions = [...PILOT_BASE_ACTIONS, 'RUN']
        } else {
            await emitLine(lib, ':: [MATRIX:ERR] Unrecognized scenario choice.')
            continue
        }

        let emitted: any
        composeAlgebraicDspMatrix(
            model,
            {
                idx: 'matrix-inspector-compose',
                dat: {
                    entityId: selectedEntity,
                    baselineProfile: neutralBaselineFor(selectedEntity),
                    sceneDeltas: {
                        deltaPitchCentitones: 0,
                        deltaFormantBps: 10000,
                        deltaFryBps: 0,
                    },
                    meters: {
                        somaticFatigueBps: PILOT_FATIGUE_BPS,
                        physicalPainBps: PILOT_PAIN_BPS,
                        paranoiaPressureBps: PILOT_PARANOIA_BPS,
                    },
                    proposedMotorActions,
                },
                slv: (res: any) => {
                    emitted = res.intBit
                },
            },
            steShim as any,
        )

        if (!emitted || emitted.idx === 'compose-dsp-matrix-err') {
            continue
        }

        const matrix = emitted.dat as ComposedSomaticDspMatrix
        if (matrix.isExhaustionStrained) {
            const multiplierX = (
                matrix.pauseFrequencyMultiplierBps / 10000
            ).toFixed(1)
            await emitLine(
                lib,
                `>> [ALGEBRAIC_DSP] :: Exhaustion Strained: Pause Frequency Multiplier locked to ${matrix.pauseFrequencyMultiplierBps} bps (${multiplierX}x) [OK]`,
            )
        }
        if (matrix.visceralReflexHoldFrames > 0) {
            await emitLine(
                lib,
                `>> [ALGEBRAIC_DSP] :: Visceral Hold Active: ${matrix.visceralReflexHoldFrames} frames injected for physicalPain >= 7000 bps [OK]`,
            )
        }
    }
}
