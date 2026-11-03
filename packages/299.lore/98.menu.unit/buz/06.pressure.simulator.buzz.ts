/* eslint-disable */
/**
 * packages/299.lore/98.menu.unit/buz/06.pressure.simulator.buzz.ts
 *
 * Interactive Pressure Meter Thermodynamic Simulator for the Somatic DSP
 * Modulation Hub. Drives 08.decay.unit integer basis-point flow math and
 * streams 7-bit ASCII receipts into the cns00 console pane.
 */

import { calculateThermodynamicStep } from '../../08.decay.unit/buz/thermodynamicFlow.buzz.js'
import { evaluateSomaticRefusalBridge } from '../../08.decay.unit/buz/interMeterBridge.buzz.js'
import {
    clampBps,
    type PressureMeter,
} from '../../08.decay.unit/val/pressureMeter.val.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export const SIMULATOR_BACK_LABEL = '[<] BACK'
export const SIMULATOR_ENTITY_IDS = ['char_wart', 'char_bog', 'char_spleen']
export const SIMULATOR_METER_CATEGORIES = [
    'SOMATIC_FATIGUE',
    'PHYSICAL_PAIN',
    'REFUSAL_STRAIN',
    'PARANOIA_CLOCK',
]
export const SIMULATOR_DEBIT_CHOICES = [
    '+2500 bp (Heavy Load Drag)',
    '+1500 bp (Combat Strain)',
    '+1000 bp (Evasion Sprint)',
]

const CATEGORY_METER_SUFFIX: Record<string, string> = {
    SOMATIC_FATIGUE: 'fatigue',
    PHYSICAL_PAIN: 'pain',
    REFUSAL_STRAIN: 'strain',
    PARANOIA_CLOCK: 'clock',
}

interface SimulatorMeterSlot {
    meter: PressureMeter
    cycles: number
}

const meterRegistry: Record<string, SimulatorMeterSlot> = {}

function registryKey(entityId: string, category: string): string {
    return `${entityId}:${category}`
}

function defaultMeterFor(entityId: string, category: string): PressureMeter {
    const short = entityId.replace(/^char_/, '')
    const suffix = CATEGORY_METER_SUFFIX[category] || 'meter'
    return {
        meterId: `mtr_${short}_${suffix}`,
        entityId,
        category: category as PressureMeter['category'],
        currentValueBp: 5000,
        baselineBp: 1500,
        decayRatePerCycleBp: 500,
        thresholdLimitBp: 8000,
        postBreakStateMutation: null,
    }
}

function parseDebitBp(choice: string): number {
    const match = /^\+(\d+)\s*bp/.exec(choice)
    return match ? Number(match[1]) : NaN
}

function sourceTagFor(choice: string): string {
    const match = /\(([^)]+)\)\s*$/.exec(choice)
    return (match ? match[1] : 'manual_injection')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
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

export function resetPressureSimulatorRegistry(): void {
    for (const key of Object.keys(meterRegistry)) {
        delete meterRegistry[key]
    }
}

export const runPressureMeterSimulatorMenu = async (
    _ste: any,
): Promise<void> => {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        return
    }

    const selectedEntity = await openChoice(
        lib,
        [...SIMULATOR_ENTITY_IDS, SIMULATOR_BACK_LABEL],
        '[SIMULATOR:ENTITY]',
    )
    if (!selectedEntity || selectedEntity === SIMULATOR_BACK_LABEL) {
        return
    }

    const selectedCategory = await openChoice(
        lib,
        [...SIMULATOR_METER_CATEGORIES, SIMULATOR_BACK_LABEL],
        '[SIMULATOR:METER]',
    )
    if (!selectedCategory || selectedCategory === SIMULATOR_BACK_LABEL) {
        return
    }

    const key = registryKey(selectedEntity, selectedCategory)
    if (!meterRegistry[key]) {
        meterRegistry[key] = {
            meter: defaultMeterFor(selectedEntity, selectedCategory),
            cycles: 0,
        }
    }

    let eventSeq = 0
    for (;;) {
        const debitChoice = await openChoice(
            lib,
            [...SIMULATOR_DEBIT_CHOICES, SIMULATOR_BACK_LABEL],
            '[SIMULATOR:DEBIT]',
        )
        if (!debitChoice || debitChoice === SIMULATOR_BACK_LABEL) {
            return
        }

        const debitBp = parseDebitBp(debitChoice)
        if (!Number.isSafeInteger(debitBp)) {
            await emitLine(lib, ':: [SIMULATOR:ERR] Unrecognized debit choice.')
            continue
        }

        const slot = meterRegistry[key]
        const previousValueBp = slot.meter.currentValueBp
        let currentValueBp: number
        let dissipatedBp: number
        let accumulatedDebitsBp: number

        if (slot.cycles === 0) {
            eventSeq += 1
            const receipt = calculateThermodynamicStep(
                slot.meter,
                [
                    {
                        eventId: `evt_sim_${eventSeq}`,
                        debitBp,
                        sourceTag: sourceTagFor(debitChoice),
                    },
                ],
                1,
            )
            currentValueBp = receipt.currentValueBp
            dissipatedBp = receipt.dissipatedBp
            accumulatedDebitsBp = receipt.accumulatedDebitsBp
        } else {
            currentValueBp = clampBps(previousValueBp + debitBp)
            dissipatedBp = 0
            accumulatedDebitsBp = debitBp
        }
        slot.cycles += 1
        slot.meter = { ...slot.meter, currentValueBp }

        await emitLine(
            lib,
            `>> [THERMODYNAMIC_FLOW] ${slot.meter.category}:${slot.meter.meterId} | ${previousValueBp} -> ${currentValueBp} bps | Dissipated: ${dissipatedBp} bps [OK]`,
        )

        const isThresholdBreached =
            currentValueBp >= slot.meter.thresholdLimitBp
        if (isThresholdBreached) {
            await emitLine(
                lib,
                `>> [THERMODYNAMIC_FLOW] :: ALERT: Threshold Limit (${slot.meter.thresholdLimitBp} bps) Breached by ${slot.meter.meterId}`,
            )
        }

        if (slot.meter.category === 'SOMATIC_FATIGUE') {
            const bridge = evaluateSomaticRefusalBridge({
                entityId: slot.meter.entityId,
                somaticFatigueBp: currentValueBp,
                refusalStrainTargetLimitBp: 8000,
            })
            if (bridge.isReductionActive) {
                await emitLine(
                    lib,
                    `>> [BRIDGE] Systemic Exhaustion Active: ${bridge.entityId} Refusal Threshold reduced by ${bridge.reductionAppliedBp} bps (New Limit: ${bridge.effectiveRefusalThresholdLimitBp} bps) [OK]`,
                )
            } else {
                await emitLine(
                    lib,
                    `>> [BRIDGE] Checking Inter-Meter Bridges: Fatigue ${currentValueBp} bps < 8000 bps (No reduction) [OK]`,
                )
            }
        }
    }
}
