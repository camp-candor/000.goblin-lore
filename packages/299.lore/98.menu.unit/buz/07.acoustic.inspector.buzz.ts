/* eslint-disable */
/**
 * packages/299.lore/98.menu.unit/buz/07.acoustic.inspector.buzz.ts
 *
 * Interactive Acoustic Paranoia Clock Inspector for the Somatic DSP
 * Modulation Hub. Drives 20.paranoia.unit centi-decibel transfer math and
 * subharmonic pitch flutter derivation, streaming 7-bit ASCII receipts
 * into the cns00 console pane.
 */

import { calculateAcousticImpulseStep } from '../../20.paranoia.unit/buz/acousticImpulse.buzz.js'
import type { AcousticImpulseReceiptBit as ReceiptBit } from '../../20.paranoia.unit/fce/paranoiaClock.bit.js'
import { calculatePitchFlutterProfile } from '../../20.paranoia.unit/buz/pitchFlutter.buzz.js'
import type {
    ParanoiaMeterState,
    AcousticTransientEvent,
} from '../../20.paranoia.unit/val/paranoiaClock.val.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export const INSPECTOR_BACK_LABEL = '[<] BACK'
export const INSPECTOR_ENTITY_IDS = ['char_bog', 'char_wart', 'char_spleen']

export interface InspectorAcousticEventOption {
    label: string
    event: AcousticTransientEvent
}

export const INSPECTOR_EVENT_OPTIONS: InspectorAcousticEventOption[] = [
    {
        label: 'evt_boiler_groan_01 (11000 cdB source, 2500 cdB wall)',
        event: {
            eventId: 'evt_boiler_groan_01',
            sourceIntensityCdB: 11000,
            partitionTransmissionLossCdB: 2500,
            ambientNoiseFloorCdB: 1500,
            auditoryDebuffCdB: 0,
            snrMinCdB: 600,
            soundDescription: 'Heavy iron steam pipe hydraulic groan',
        },
    },
    {
        label: 'evt_pipe_rupture_02 (12000 cdB source, 2500 cdB wall)',
        event: {
            eventId: 'evt_pipe_rupture_02',
            sourceIntensityCdB: 12000,
            partitionTransmissionLossCdB: 2500,
            ambientNoiseFloorCdB: 1500,
            auditoryDebuffCdB: 0,
            snrMinCdB: 600,
            soundDescription: 'High pressure pipe rupture blast',
        },
    },
    {
        label: 'evt_faint_scuff_03 (2500 cdB source, 2000 cdB wall)',
        event: {
            eventId: 'evt_faint_scuff_03',
            sourceIntensityCdB: 2500,
            partitionTransmissionLossCdB: 2000,
            ambientNoiseFloorCdB: 1500,
            auditoryDebuffCdB: 0,
            snrMinCdB: 600,
            soundDescription: 'Distant rat scratch',
        },
    },
]

interface InspectorClockSlot {
    clock: ParanoiaMeterState
    epoch: number
}

const clockRegistry: Record<string, InspectorClockSlot> = {}

function defaultClockFor(entityId: string): ParanoiaMeterState {
    const short = entityId.replace(/^char_/, '')
    return {
        clockId: `clk_${short}_paranoia`,
        entityId,
        clockName: `${short} Epistemic Watch`,
        currentBps: 2400,
        baselineBps: 2400,
        maxCeilingBps: 10000,
        decayRatePerTick: 300,
        acousticCouplingCoeff: 5000,
        thresholdLimitBps: 8000,
        ambientDarknessLock: false,
        isTriggered: false,
        updatedAtEpoch: 0,
    }
}

function formatTremorHz(subharmonicFlutterHzBps: number): string {
    const truncatedHundredths = Math.floor(subharmonicFlutterHzBps / 100)
    return (truncatedHundredths / 100).toFixed(2)
}

function vigilanceLabel(currentBps: number): string {
    if (currentBps >= 8000) return 'Panic Locked'
    if (currentBps >= 5000) return 'Hypervigilant'
    return 'Steady'
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

export function resetAcousticInspectorRegistry(): void {
    for (const key of Object.keys(clockRegistry)) {
        delete clockRegistry[key]
    }
}

export const runAcousticParanoiaInspectorMenu = async (
    _ste: any,
): Promise<void> => {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        return
    }

    const selectedEntity = await openChoice(
        lib,
        [...INSPECTOR_ENTITY_IDS, INSPECTOR_BACK_LABEL],
        '[INSPECTOR:ENTITY]',
    )
    if (!selectedEntity || selectedEntity === INSPECTOR_BACK_LABEL) {
        return
    }

    if (!clockRegistry[selectedEntity]) {
        clockRegistry[selectedEntity] = {
            clock: defaultClockFor(selectedEntity),
            epoch: 0,
        }
    }

    const eventLabels = INSPECTOR_EVENT_OPTIONS.map((o) => o.label)
    for (;;) {
        const eventChoice = await openChoice(
            lib,
            [...eventLabels, INSPECTOR_BACK_LABEL],
            '[INSPECTOR:EVENT]',
        )
        if (!eventChoice || eventChoice === INSPECTOR_BACK_LABEL) {
            return
        }

        const option = INSPECTOR_EVENT_OPTIONS.find(
            (o) => o.label === eventChoice,
        )
        if (!option) {
            await emitLine(lib, ':: [INSPECTOR:ERR] Unrecognized event choice.')
            continue
        }

        const slot = clockRegistry[selectedEntity]
        slot.epoch += 1
        const receipt: ReceiptBit = calculateAcousticImpulseStep(
            slot.clock,
            option.event,
            slot.epoch,
        )
        slot.clock = {
            ...slot.clock,
            currentBps: receipt.nextBps,
            isTriggered: receipt.isTriggered,
            updatedAtEpoch: receipt.updatedEpoch,
        }

        const alertNotice = receipt.isTriggered ? ' [!] BOIL-OVER TRIPPED' : ''
        await emitLine(
            lib,
            `>> [ACOUSTIC_IMPULSE] ${receipt.entityId} | Arrival: ${receipt.arrivalIntensityCdB} cdB | Next: ${receipt.nextBps}/${slot.clock.thresholdLimitBps} bps${alertNotice} [OK]`,
        )

        const flutter = calculatePitchFlutterProfile(slot.clock)
        await emitLine(
            lib,
            `>> [PITCH_FLUTTER] ${flutter.entityId} | Tremor: ${formatTremorHz(flutter.subharmonicFlutterHzBps)} Hz | Depth: ${flutter.flutterDepthCentitones} centitones | Vision Cone: ${flutter.visionConeDegrees} deg (${vigilanceLabel(flutter.currentBps)}) [OK]`,
        )
    }
}
