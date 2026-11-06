/* eslint-disable */
/**
 * packages/299.lore/98.menu.unit/buz/11.vocal.feasibility.buzz.ts
 *
 * Interactive Vocal-Motor Feasibility Gate Inspector for the Somatic DSP
 * Modulation Hub. Drives 22.payload.unit fail-closed aphonia assertions and
 * streams 7-bit ASCII receipts into the cns00 console pane.
 */

import { PayloadModel } from '../../22.payload.unit/payload.model.js'
import { verifyVocalFeasibility } from '../../22.payload.unit/payload.buzzer.js'
import type { VocalFeasibilityCandidate } from '../../22.payload.unit/val/aphoniaGate.val.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export const FEASIBILITY_BACK_LABEL = '[<] BACK'
export const FEASIBILITY_CHARACTER_OPTIONS = [
    'char_bog',
    'char_wart',
    'char_spleen',
]

export const PRESET_CANDIDATE_BOG: VocalFeasibilityCandidate = {
    entityId: 'char_bog',
    verbatimText: 'Move the lever now.',
    activeConditions: [],
    bannedKineticVerbs: [],
    isNonVerbalExpression: false,
}

export const PRESET_CANDIDATE_WART: VocalFeasibilityCandidate = {
    entityId: 'char_wart',
    verbatimText: 'I can still whisper.',
    activeConditions: ['cnd_crushed_larynx'],
    bannedKineticVerbs: [],
    isNonVerbalExpression: false,
}

export const PRESET_CANDIDATE_SPLEEN: VocalFeasibilityCandidate = {
    entityId: 'char_spleen',
    verbatimText: 'Speak now.',
    activeConditions: [],
    bannedKineticVerbs: ['speak'],
    isNonVerbalExpression: false,
}

export const PRESET_CANDIDATES: Record<string, VocalFeasibilityCandidate> = {
    char_bog: PRESET_CANDIDATE_BOG,
    char_wart: PRESET_CANDIDATE_WART,
    char_spleen: PRESET_CANDIDATE_SPLEEN,
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

export const runVocalFeasibilityInspectorMenu = async (
    _ste: any,
): Promise<void> => {
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

    let nextChar: string | undefined

    for (;;) {
        let charChoice = nextChar
        nextChar = undefined

        if (!charChoice) {
            charChoice = await openChoice(
                lib,
                [...FEASIBILITY_CHARACTER_OPTIONS, FEASIBILITY_BACK_LABEL],
                '[FEASIBILITY:CHARACTER]',
            )
        }

        if (!charChoice || charChoice === FEASIBILITY_BACK_LABEL) {
            return
        }

        const preset = PRESET_CANDIDATES[charChoice]
        if (!preset) {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: [FEASIBILITY] Unknown character option: ${charChoice}`,
            })
            continue
        }

        const dialogueChoice = await openChoice(
            lib,
            [preset.verbatimText, FEASIBILITY_BACK_LABEL],
            '[FEASIBILITY:DIALOGUE]',
        )

        if (!dialogueChoice || dialogueChoice === FEASIBILITY_BACK_LABEL) {
            continue
        }

        if (FEASIBILITY_CHARACTER_OPTIONS.includes(dialogueChoice)) {
            // Queue fast-forward fallback: dialogue was skipped in mock queue
            const candidate = { ...preset }
            await verifyVocalFeasibility(
                model,
                {
                    idx: `feasibility-${candidate.entityId}`,
                    dat: candidate,
                } as any,
                captureShim as any,
            )
            nextChar = dialogueChoice
            continue
        }

        const candidate: VocalFeasibilityCandidate = {
            ...preset,
            verbatimText: dialogueChoice.replace(/^"(.*)"$/, '$1'),
        }

        await verifyVocalFeasibility(
            model,
            { idx: `feasibility-${candidate.entityId}`, dat: candidate } as any,
            captureShim as any,
        )
    }
}
