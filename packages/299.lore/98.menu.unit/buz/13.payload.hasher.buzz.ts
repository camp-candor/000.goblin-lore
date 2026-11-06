/* eslint-disable */
/**
 * packages/299.lore/98.menu.unit/buz/13.payload.hasher.buzz.ts
 *
 * Interactive Deterministic Payload Hasher for the Somatic DSP
 * Modulation Hub. Drives 22.payload.unit RFC 8785 canonical hashing and
 * hash parity assertions, streaming 7-bit ASCII receipts into the cns00 console pane.
 */

import { PayloadModel } from '../../22.payload.unit/payload.model.js'
import {
    hashTtsGenerationPayload,
    verifyPayloadHashParity,
} from '../../22.payload.unit/payload.buzzer.js'
import { assertPayloadHashParity } from '../../22.payload.unit/buz/canonicalPayloadHasher.buzz.js'
import {
    PRESET_LINE_WART_001,
    PRESET_LINE_BOG_002,
} from './10.payload.validator.buzz.js'
import type { TTSGenerationRequest } from '../../22.payload.unit/val/ttsPayload.val.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export const HASHER_BACK_LABEL = '[<] BACK'
export const HASHER_AUDIT_LABEL = '[Inject Hash Parity Audit]'
export const HASHER_TARGET_OPTIONS = [
    'line_wart_001',
    'line_bog_002',
    HASHER_AUDIT_LABEL,
]

export const PRESET_PAYLOADS: Record<string, TTSGenerationRequest> = {
    line_wart_001: PRESET_LINE_WART_001,
    line_bog_002: PRESET_LINE_BOG_002,
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

export const runDeterministicPayloadHasherMenu = async (
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

    let nextTarget: string | undefined

    for (;;) {
        let choice = nextTarget
        nextTarget = undefined

        if (!choice) {
            choice = await openChoice(
                lib,
                [...HASHER_TARGET_OPTIONS, HASHER_BACK_LABEL],
                '[PAYLOAD_HASHER:TARGET]',
            )
        }

        if (!choice || choice === HASHER_BACK_LABEL) {
            return
        }

        if (choice === 'line_wart_001' || choice === 'line_bog_002') {
            const req = PRESET_PAYLOADS[choice]
            hashTtsGenerationPayload(
                model,
                {
                    idx: `hash-${req.lineId}`,
                    dat: { payload: req, epoch: 0 },
                } as any,
                captureShim as any,
            )

            const receipt = model.hashedPayloads[req.lineId]
            if (receipt) {
                verifyPayloadHashParity(
                    model,
                    {
                        idx: `parity-${req.lineId}`,
                        dat: {
                            expectedHash: receipt.payloadSha256,
                            payload: req,
                            epoch: 0,
                        },
                    } as any,
                    captureShim as any,
                )
            }
        } else if (choice === HASHER_AUDIT_LABEL) {
            const fakeHash = '0'.repeat(64)
            verifyPayloadHashParity(
                model,
                {
                    idx: 'parity-audit-fail',
                    dat: {
                        expectedHash: fakeHash,
                        payload: PRESET_LINE_WART_001,
                        epoch: 0,
                    },
                } as any,
                captureShim as any,
            )

            try {
                assertPayloadHashParity(fakeHash, PRESET_LINE_WART_001)
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err)
                await lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `:: [PAYLOAD_HASH FAIL] ${message}`,
                })
            }
        } else {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: [PAYLOAD_HASHER] Unknown target option: ${choice}`,
            })
        }
    }
}
