import { describe, it, expect } from 'vitest';
import { runSomaticGauntlet } from '../scripts/verify-somatic-gauntlet.js';

describe('299.lore :: Phase 8 Local Verification Gauntlet', () => {
  it('executes the full 5-stage negative-control gauntlet and certifies 5/5 traps at T0 = $0.00', () => {
    const summary = runSomaticGauntlet(100);

    expect(summary.totalTraps).toBe(5);
    expect(summary.trapsPassed).toBe(5);
    expect(summary.isCertified).toBe(true);
    expect(summary.results.length).toBe(5);

    for (const trap of summary.results) {
      expect(trap.passed).toBe(true);
      expect(trap.executionLatencyMs).toBeGreaterThanOrEqual(0);
      expect(trap.caughtExceptionSignature).not.toBe('NONE');
    }

    expect(Object.isFrozen(summary)).toBe(true);
  });

  it('verifies that each trap catches its designated domain exception', () => {
    const summary = runSomaticGauntlet(101);

    const trap1 = summary.results.find((r) => r.trapId === 'TRAP_1_FLOAT_METRIC_PROHIBITED');
    expect(trap1?.caughtExceptionSignature).toBe('[FLOAT_PROHIBITED]');

    const trap2 = summary.results.find((r) => r.trapId === 'TRAP_2_UNSCHEMAED_KEY_CLOSURE');
    expect(trap2?.caughtExceptionSignature).toBe('ZOD_STRICT_UNRECOGNIZED_KEYS');

    const trap3 = summary.results.find((r) => r.trapId === 'TRAP_3_APHONIC_DELIVERY_BREACH');
    expect(trap3?.caughtExceptionSignature).toBe('VOCAL_DELIVERY_BREACH');

    const trap4 = summary.results.find((r) => r.trapId === 'TRAP_4_MONOTONIC_VERSION_REGRESSION');
    expect(trap4?.caughtExceptionSignature).toBe('MONOTONIC_VERSION_REGRESSION_BREACH');

    const trap5 = summary.results.find((r) => r.trapId === 'TRAP_5_RFC8785_HASH_PARITY_BREACH');
    expect(trap5?.caughtExceptionSignature).toBe('PAYLOAD_HASH_PARITY_BREACH');
  });
});
