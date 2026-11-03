import {
  PressureMeterSchema,
  FrictionDebitEventSchema,
  assertIntegerMetric,
  clampBps,
  type PressureMeter,
  type FrictionDebitEvent,
} from '../val/pressureMeter.val.js';
import type { ThermodynamicCycleReceiptBit } from '../fce/pressureMeter.bit.js';

export function calculateThermodynamicStep(
  meterInput: PressureMeter,
  frictionEvents: readonly FrictionDebitEvent[] = [],
  tick: number = 0,
): ThermodynamicCycleReceiptBit {
  const meter = PressureMeterSchema.parse(meterInput);
  assertIntegerMetric(tick, 'tick');

  let totalFrictionDebitsBp = 0;
  for (const event of frictionEvents) {
    const parsedEvent = FrictionDebitEventSchema.parse(event);
    assertIntegerMetric(parsedEvent.debitBp, 'debitBp');
    totalFrictionDebitsBp += parsedEvent.debitBp;
  }
  totalFrictionDebitsBp = clampBps(totalFrictionDebitsBp);

  const previousValueBp = meter.currentValueBp;
  const rawDecayed = previousValueBp - meter.decayRatePerCycleBp;
  const cooledValueBp = Math.max(meter.baselineBp, rawDecayed);
  const dissipatedBp = previousValueBp - cooledValueBp;

  const nextValueBp = clampBps(cooledValueBp + totalFrictionDebitsBp);
  const isThresholdBreached = nextValueBp >= meter.thresholdLimitBp;

  const receipt: ThermodynamicCycleReceiptBit = {
    meterId: meter.meterId,
    entityId: meter.entityId,
    category: meter.category,
    previousValueBp,
    currentValueBp: nextValueBp,
    baselineBp: meter.baselineBp,
    dissipatedBp,
    accumulatedDebitsBp: totalFrictionDebitsBp,
    isThresholdBreached,
    updatedTick: tick,
  };

  return Object.freeze(receipt);
}

export function batchStepThermodynamicMeters(
  meters: readonly PressureMeter[],
  frictionMap: Record<string, readonly FrictionDebitEvent[]> = {},
  tick: number = 0,
): ThermodynamicCycleReceiptBit[] {
  return meters.map((m) => calculateThermodynamicStep(m, frictionMap[m.meterId] || [], tick));
}
