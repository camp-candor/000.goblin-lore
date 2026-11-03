import type { DecayModel } from './decay.model.js';
import type PressureMeterBit from './fce/pressureMeter.bit.js';
import type State from '../99.core/state.js';
import { calculateThermodynamicStep } from './buz/thermodynamicFlow.buzz.js';
import { evaluateSomaticRefusalBridge } from './buz/interMeterBridge.buzz.js';

const UPDATE_CONSOLE = '[Console action] Update Console';

export const initDecay = (cpy: DecayModel, bal: PressureMeterBit, _ste: State): DecayModel => {
  cpy.meters = {};
  cpy.cycleReceipts = {};
  if (bal?.slv) {
    bal.slv({ dcyBit: { idx: 'init-decay-ok', val: 1 } });
  }
  return cpy;
};

export const updateDecay = (cpy: DecayModel, bal: PressureMeterBit, _ste: State): DecayModel => {
  if (bal?.slv) {
    bal.slv({ dcyBit: { idx: 'update-decay-ok', val: 1 } });
  }
  return cpy;
};

export const stepThermodynamicCycle = async (
  cpy: DecayModel,
  bal: PressureMeterBit & { dat: any },
  ste: State,
): Promise<DecayModel> => {
  const payload = bal.dat;
  if (!payload || !payload.meter) {
    if (bal.slv) bal.slv({ dcyBit: { idx: 'step-thermodynamic-cycle-fail', val: -1 } });
    return cpy;
  }

  try {
    const receipt = calculateThermodynamicStep(payload.meter, payload.frictionDebits || [], payload.tick || 0);

    cpy.meters[receipt.meterId] = {
      ...payload.meter,
      currentValueBp: receipt.currentValueBp,
    };
    cpy.cycleReceipts[receipt.meterId] = receipt;

    if (ste) {
      await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [THERMODYNAMIC_FLOW] ${receipt.category}:${receipt.meterId} | ${receipt.previousValueBp} -> ${receipt.currentValueBp} bps | Dissipated: ${receipt.dissipatedBp} bps [OK]`,
      });
    }

    if (bal.slv) {
      bal.slv({
        dcyBit: {
          idx: 'step-thermodynamic-cycle-ok',
          val: receipt.currentValueBp,
          dat: receipt,
        },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (ste) {
      await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `:: [THERMODYNAMIC_FLOW FAIL] ${message}`,
      });
    }
    if (bal.slv) {
      bal.slv({
        dcyBit: {
          idx: 'step-thermodynamic-cycle-err',
          val: -1,
          src: message,
        },
      });
    }
  }

  return cpy;
};

export const evaluateInterMeterBridge = (
  cpy: DecayModel,
  bal: PressureMeterBit & { dat: any },
  _ste: State,
): DecayModel => {
  const payload = bal.dat;
  if (!payload) {
    if (bal.slv) bal.slv({ dcyBit: { idx: 'evaluate-inter-meter-bridge-fail', val: -1 } });
    return cpy;
  }

  try {
    const receipt = evaluateSomaticRefusalBridge(payload);
    if (bal.slv) {
      bal.slv({
        dcyBit: {
          idx: 'evaluate-inter-meter-bridge-ok',
          val: receipt.effectiveRefusalThresholdLimitBp,
          dat: receipt as any,
        },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (bal.slv) {
      bal.slv({
        dcyBit: {
          idx: 'evaluate-inter-meter-bridge-err',
          val: -1,
          src: message,
        },
      });
    }
  }

  return cpy;
};
