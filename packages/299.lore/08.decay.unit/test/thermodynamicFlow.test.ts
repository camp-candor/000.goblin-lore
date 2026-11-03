import { describe, it, expect } from 'vitest';
import {
  calculateThermodynamicStep,
  batchStepThermodynamicMeters,
} from '../buz/thermodynamicFlow.buzz.js';
import { evaluateSomaticRefusalBridge } from '../buz/interMeterBridge.buzz.js';
import {
  assertIntegerMetric,
  clampBps,
  type PressureMeter,
} from '../val/pressureMeter.val.js';
import { DecayModel } from '../decay.model.js';
import {
  initDecay,
  stepThermodynamicCycle,
  evaluateInterMeterBridge,
} from '../decay.buzzer.js';

describe('08.decay.unit :: Unified Pressure Meter Thermodynamic Accumulator', () => {
  const baseSomaticMeter: PressureMeter = {
    meterId: 'mtr_wart_fatigue',
    entityId: 'char_wart',
    category: 'SOMATIC_FATIGUE',
    currentValueBp: 5000,
    baselineBp: 1500,
    decayRatePerCycleBp: 500,
    thresholdLimitBp: 8000,
    postBreakStateMutation: null,
  };

  it('asserts integer metric invariants and rejects floating-point numbers', () => {
    expect(() => assertIntegerMetric(500, 'decayRate')).not.toThrow();
    expect(() => assertIntegerMetric(500.5, 'decayRate')).toThrowError('[FLOAT_PROHIBITED]');
    expect(() => assertIntegerMetric(NaN, 'decayRate')).toThrowError('[FLOAT_PROHIBITED]');
  });

  it('clamps basis points strictly within the [0, 10000] interval', () => {
    expect(clampBps(-500)).toBe(0);
    expect(clampBps(5000)).toBe(5000);
    expect(clampBps(15000)).toBe(10000);
  });

  it('dissipates stress during rest cycles while respecting chronic baseline floor', () => {
    const stepped = calculateThermodynamicStep(baseSomaticMeter, [], 1);
    expect(stepped.currentValueBp).toBe(4500); // 5000 - 500
    expect(stepped.dissipatedBp).toBe(500);
    expect(stepped.isThresholdBreached).toBe(false);

    // Multi-cycle dissipation clamping at baselineBp = 1500
    let currentMeter = { ...baseSomaticMeter, currentValueBp: 1800 };
    const nearFloor = calculateThermodynamicStep(currentMeter, [], 2);
    expect(nearFloor.currentValueBp).toBe(1500); // 1800 - 500 clamped at baseline 1500
    expect(nearFloor.dissipatedBp).toBe(300);

    const atFloor = calculateThermodynamicStep({ ...baseSomaticMeter, currentValueBp: 1500 }, [], 3);
    expect(atFloor.currentValueBp).toBe(1500);
    expect(atFloor.dissipatedBp).toBe(0);
  });

  it('accumulates friction debit events and detects threshold limit breaches', () => {
    const highFrictionEvents = [
      { eventId: 'evt_fuel_drag', debitBp: 2500, sourceTag: 'heavy_load' },
      { eventId: 'evt_combat_strain', debitBp: 1500, sourceTag: 'evasion' },
    ];

    const stepped = calculateThermodynamicStep(baseSomaticMeter, highFrictionEvents, 5);
    // (5000 - 500) + 4000 = 8500 bps
    expect(stepped.currentValueBp).toBe(8500);
    expect(stepped.accumulatedDebitsBp).toBe(4000);
    expect(stepped.isThresholdBreached).toBe(true); // 8500 >= 8000
  });

  it('evaluates the inter-meter bridge rule reducing refusal threshold by 20% at high fatigue', () => {
    // Unexhausted state (< 8000 bps)
    const normalState = evaluateSomaticRefusalBridge({
      entityId: 'char_wart',
      somaticFatigueBp: 7500,
      refusalStrainTargetLimitBp: 8000,
    });
    expect(normalState.isReductionActive).toBe(false);
    expect(normalState.effectiveRefusalThresholdLimitBp).toBe(8000);
    expect(normalState.reductionAppliedBp).toBe(0);

    // Exhausted state (>= 8000 bps)
    const exhaustedState = evaluateSomaticRefusalBridge({
      entityId: 'char_wart',
      somaticFatigueBp: 8200,
      refusalStrainTargetLimitBp: 8000,
    });
    expect(exhaustedState.isReductionActive).toBe(true);
    expect(exhaustedState.effectiveRefusalThresholdLimitBp).toBe(6400); // 8000 * 0.80
    expect(exhaustedState.reductionAppliedBp).toBe(1600);
  });

  it('executes batch thermodynamic steps and wires through buzzer handlers', async () => {
    const model = new DecayModel();
    initDecay(model, { idx: 'init' }, {} as any);

    let emittedReceipt: any;
    stepThermodynamicCycle(
      model,
      {
        idx: 'step-test',
        dat: {
          meter: baseSomaticMeter,
          frictionDebits: [{ eventId: 'evt_sprint', debitBp: 1000, sourceTag: 'sprint' }],
          tick: 12,
        },
        slv: (res) => {
          emittedReceipt = res.dcyBit.dat;
        },
      },
      { hunt: () => {} } as any,
    );

    expect(emittedReceipt).toBeDefined();
    expect(emittedReceipt.currentValueBp).toBe(5500); // (5000 - 500) + 1000
    expect(model.meters['mtr_wart_fatigue']).toBeDefined();
    expect(model.cycleReceipts['mtr_wart_fatigue']).toBeDefined();

    let bridgeReceipt: any;
    evaluateInterMeterBridge(
      model,
      {
        idx: 'bridge-test',
        dat: {
          entityId: 'char_wart',
          somaticFatigueBp: 8500,
          refusalStrainTargetLimitBp: 10000,
        },
        slv: (res) => {
          bridgeReceipt = res.dcyBit.dat;
        },
      },
      {} as any,
    );

    expect(bridgeReceipt).toBeDefined();
    expect(bridgeReceipt.effectiveRefusalThresholdLimitBp).toBe(8000); // 10000 * 0.80
  });
});
