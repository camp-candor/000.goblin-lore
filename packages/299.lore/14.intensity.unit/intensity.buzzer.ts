import type { IntensityModel } from './intensity.model.js';
import type IntensityBit from './fce/algebraicDsp.bit.js';
import type State from '../99.core/state.js';
import {
  AlgebraicDspCompositionInputSchema,
  ComposedSomaticDspMatrixSchema,
  type ComposedSomaticDspMatrix,
} from './val/algebraicDsp.val.js';
import { composePitchFormantVelocity } from './buz/pitchFormantComposer.buzz.js';
import { calculateBreathPauseDilation } from './buz/breathDilation.buzz.js';
import { composeVocalFryVisceralHold } from './buz/vocalFryComposer.buzz.js';
import { assertMotorCollapseFeasibility } from './buz/motorCollapseGate.buzz.js';

const UPDATE_CONSOLE = '[Console action] Update Console';

export const initIntensity = (cpy: IntensityModel, bal: IntensityBit, _ste: State): IntensityModel => {
  cpy.composedMatrices = {};
  if (bal?.slv) {
    bal.slv({ intBit: { idx: 'init-intensity-ok', val: 1 } });
  }
  return cpy;
};

export const updateIntensity = (cpy: IntensityModel, bal: IntensityBit, _ste: State): IntensityModel => {
  if (bal?.slv) {
    bal.slv({ intBit: { idx: 'update-intensity-ok', val: 1 } });
  }
  return cpy;
};

export const composeAlgebraicDspMatrix = (
  cpy: IntensityModel,
  bal: IntensityBit & { dat: any },
  ste: State,
): IntensityModel => {
  const payload = bal.dat;
  if (!payload || !payload.entityId || !payload.baselineProfile) {
    if (bal.slv) bal.slv({ intBit: { idx: 'compose-dsp-matrix-fail', val: -1 } });
    return cpy;
  }

  try {
    const input = AlgebraicDspCompositionInputSchema.parse(payload);

    // 1. Feasibility check: halt at T0 = $0.00 if motor collapse is breached
    assertMotorCollapseFeasibility(input.meters.somaticFatigueBps, input.proposedMotorActions);

    // 2. Fundamental pitch, formant warping, and conversational pacing
    const pfv = composePitchFormantVelocity(
      input.baselineProfile.pitchShiftCentitones,
      input.sceneDeltas.deltaPitchCentitones,
      input.baselineProfile.formantWarpingBps,
      input.sceneDeltas.deltaFormantBps,
      input.baselineProfile.speedMultiplierBps,
      input.meters.somaticFatigueBps,
    );

    // 3. Respiratory pause dilation and continuous duration expansion
    const breath = calculateBreathPauseDilation(
      input.baselineProfile.breathinessPauseMultiplierBps,
      input.meters.somaticFatigueBps,
    );

    // 4. Glottal fry density and visceral reflex holds
    const fry = composeVocalFryVisceralHold(
      input.baselineProfile.vocalFryDensityBps,
      input.sceneDeltas.deltaFryBps,
      input.meters.somaticFatigueBps,
      input.meters.physicalPainBps,
    );

    const matrix: ComposedSomaticDspMatrix = ComposedSomaticDspMatrixSchema.parse({
      entityId: input.entityId,
      effectivePitchCentitones: pfv.effectivePitchCentitones,
      effectiveFormantWarpingBps: pfv.effectiveFormantWarpingBps,
      effectiveTonePacingBps: pfv.effectiveTonePacingBps,
      effectiveBreathinessPauseBps: breath.effectiveBreathinessPauseBps,
      pauseFrequencyMultiplierBps: breath.pauseFrequencyMultiplierBps,
      effectiveVocalFryDensityBps: fry.effectiveVocalFryDensityBps,
      estimatedDurationExpansionBps: breath.estimatedDurationExpansionBps,
      visceralReflexHoldFrames: fry.visceralReflexHoldFrames,
      isExhaustionStrained: breath.isExhaustionStrained,
      bannedCadences: Object.freeze([...input.baselineProfile.bannedCadences]),
    });

    cpy.composedMatrices[matrix.entityId] = Object.freeze(matrix);

    if (ste) {
      ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [ALGEBRAIC_DSP] Composed DSP Matrix for ${matrix.entityId} | Pacing: ${matrix.effectiveTonePacingBps} bps | Pause: ${matrix.effectiveBreathinessPauseBps} bps | Fry: ${matrix.effectiveVocalFryDensityBps} bps [OK]`,
      });
    }

    if (bal.slv) {
      bal.slv({
        intBit: {
          idx: 'compose-dsp-matrix-ok',
          val: matrix.effectiveTonePacingBps,
          dat: matrix,
        },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (ste) {
      ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `:: [ALGEBRAIC_DSP FAIL] ${message}`,
      });
    }
    if (bal.slv) {
      bal.slv({
        intBit: {
          idx: 'compose-dsp-matrix-err',
          val: -1,
          src: message,
        },
      });
    }
  }

  return cpy;
};
