import { assertIntegerMetric } from '../val/algebraicDsp.val.js';

export const BANNED_HIGH_FATIGUE_ACTIONS = ['RUN', 'SPRINT', 'VAULT', 'SPRINT_AWAY'] as const;

export function assertMotorCollapseFeasibility(
  somaticFatigueBps: number,
  proposedMotorActions: readonly string[],
): void {
  assertIntegerMetric(somaticFatigueBps, 'somaticFatigueBps');

  if (somaticFatigueBps > 8000) {
    for (const action of proposedMotorActions) {
      const normalized = action.trim().toUpperCase();
      if (BANNED_HIGH_FATIGUE_ACTIONS.some(banned => normalized.includes(banned))) {
        throw new Error(
          `CANON_BREACH: Motor collapse - character fatigue ${somaticFatigueBps} bps prohibits kinetic verb '${action}'`,
        );
      }
    }
  }
}
