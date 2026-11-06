import { fileURLToPath } from "node:url";
import {
  GauntletTrapResultSchema,
  SomaticGauntletSummarySchema,
  type GauntletTrapResult,
  type SomaticGauntletSummary,
} from '../val/gauntlet.val.js';
import { assertIntegerMetric, TTSGenerationRequestSchema } from '../22.payload.unit/val/ttsPayload.val.js';
import { assertVocalMotorFeasibility } from '../22.payload.unit/buz/vocalFeasibilityGate.buzz.js';
import { evaluateSceneSomaticStaleness } from '../22.payload.unit/buz/pinSomaticFactVersion.buzz.js';
import { assertPayloadHashParity } from '../22.payload.unit/buz/canonicalPayloadHasher.buzz.js';

export function runSomaticGauntlet(epoch: number = Date.now()): SomaticGauntletSummary {
  const startTime = Date.now();
  const results: GauntletTrapResult[] = [];

  console.log('------------------------------------------------------------');
  console.log('>> [GAUNTLET] 299.LORE // SOMATIC VERIFICATION GAUNTLET (T0 = $0.00)');
  console.log('>> [ASSERTION] Evaluating 5 Fail-Closed Negative-Control Invariants');
  console.log('------------------------------------------------------------');

  // STAGE 1: Float Metric Injection Trap
  const t1Start = performance.now();
  let t1Passed = false;
  let t1Sig = '';
  try {
    assertIntegerMetric(8000.5, 'thresholdLimitBp');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('[FLOAT_PROHIBITED]')) {
      t1Passed = true;
      t1Sig = '[FLOAT_PROHIBITED]';
    }
  }
  const t1Dur = performance.now() - t1Start;
  results.push(
    GauntletTrapResultSchema.parse({
      trapId: 'TRAP_1_FLOAT_METRIC_PROHIBITED',
      stageName: 'STAGE 1: INTEGER BASIS-POINT ENFORCEMENT',
      targetUnit: '14.intensity.unit / 35.threshold.unit / 22.payload.unit',
      passed: t1Passed,
      caughtExceptionSignature: t1Sig || 'NONE',
      executionLatencyMs: Number(t1Dur.toFixed(3)),
      diagnosticTrace: t1Passed
        ? 'Trapped non-integer floating-point input in basis-point metric.'
        : 'CRITICAL: Float injection bypassed validator.',
    }),
  );
  console.log(`>> [STAGE_1] Float Metric Trap -> ${t1Passed ? '[OK] TRAPPED' : '[FAIL] LEAKED'}`);

  // STAGE 2: Closed-World Strict Schema Ingress Trap
  const t2Start = performance.now();
  let t2Passed = false;
  let t2Sig = '';
  try {
    TTSGenerationRequestSchema.parse({
      seriesSlug: 'under-the-floorboards',
      sceneId: 'sc_culvert_siphon_01',
      lineId: 'line_wart_001',
      characterId: 'char_wart',
      verbatimText: 'Keep the tallow dry.',
      conditioningStrategy: 'ZERO_SHOT_WAV',
      composedDspMatrix: {
        entityId: 'char_wart',
        effectivePitchCentitones: 0,
        effectiveFormantWarpingBps: 10000,
        effectiveTonePacingBps: 10000,
        effectiveBreathinessPauseBps: 10000,
        pauseFrequencyMultiplierBps: 10000,
        effectiveVocalFryDensityBps: 0,
        estimatedDurationExpansionBps: 0,
        visceralReflexHoldFrames: 0,
        isExhaustionStrained: false,
        bannedCadences: [],
      },
      somaticMask: {
        armsAvailableBps: 10000,
        locomotionBaseline: 'bipedal',
        activeConditions: [],
        bannedKineticVerbs: [],
        opticalState: 'NORMAL',
        blindConeDegrees: 0,
        canSpeak: true,
      },
      pinnedFactVersions: {},
      rogueHallucinatedKey: 'ILLEGAL_VALUE',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unrecognized_keys') || msg.includes('rogueHallucinatedKey')) {
      t2Passed = true;
      t2Sig = 'ZOD_STRICT_UNRECOGNIZED_KEYS';
    }
  }
  const t2Dur = performance.now() - t2Start;
  results.push(
    GauntletTrapResultSchema.parse({
      trapId: 'TRAP_2_UNSCHEMAED_KEY_CLOSURE',
      stageName: 'STAGE 2: CLOSED-WORLD STRICT SCHEMA ENFORCEMENT',
      targetUnit: '22.payload.unit',
      passed: t2Passed,
      caughtExceptionSignature: t2Sig || 'NONE',
      executionLatencyMs: Number(t2Dur.toFixed(3)),
      diagnosticTrace: t2Passed
        ? 'Trapped extraneous un-schemaed key via .strict() closure.'
        : 'CRITICAL: Un-schemaed key leaked into ingress payload.',
    }),
  );
  console.log(`>> [STAGE_2] Strict Key Closure Trap -> ${t2Passed ? '[OK] TRAPPED' : '[FAIL] LEAKED'}`);

  // STAGE 3: Aphonic Vocal-Motor Feasibility Trap
  const t3Start = performance.now();
  let t3Passed = false;
  let t3Sig = '';
  try {
    assertVocalMotorFeasibility({
      entityId: 'char_wart',
      verbatimText: 'I can speak through iron.',
      activeConditions: ['cnd_crushed_larynx'],
      bannedKineticVerbs: [],
      isNonVerbalExpression: false,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('VOCAL_DELIVERY_BREACH')) {
      t3Passed = true;
      t3Sig = 'VOCAL_DELIVERY_BREACH';
    }
  }
  const t3Dur = performance.now() - t3Start;
  results.push(
    GauntletTrapResultSchema.parse({
      trapId: 'TRAP_3_APHONIC_DELIVERY_BREACH',
      stageName: 'STAGE 3: APHONIC VOCAL-MOTOR FEASIBILITY SENTRY',
      targetUnit: '22.payload.unit / 39.verbs.unit',
      passed: t3Passed,
      caughtExceptionSignature: t3Sig || 'NONE',
      executionLatencyMs: Number(t3Dur.toFixed(3)),
      diagnosticTrace: t3Passed
        ? 'Trapped verbal phonation attempt by an actor with crushed larynx.'
        : 'CRITICAL: Aphonic actor permitted verbal dialogue dispatch.',
    }),
  );
  console.log(`>> [STAGE_3] Aphonia Delivery Trap -> ${t3Passed ? '[OK] TRAPPED' : '[FAIL] LEAKED'}`);

  // STAGE 4: Monotonic Version Regression Trap
  const t4Start = performance.now();
  let t4Passed = false;
  let t4Sig = '';
  try {
    evaluateSceneSomaticStaleness({
      sceneId: 'sc_regression_audit',
      pinnedFacts: [
        {
          factId: 'fact_wart_arm_severed',
          pinnedVersion: 4,
          pinnedHash: 'a'.repeat(64),
          claimText: 'Amputated shoulder.',
          scope: 'CHARACTER',
        },
      ],
      liveLedgerFacts: {
        fact_wart_arm_severed: {
          factId: 'fact_wart_arm_severed',
          currentVersion: 2, // Live version 2 < pinned version 4
          contentHash: 'b'.repeat(64),
          claimText: 'Forearm injury.',
          isRetired: false,
        },
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('MONOTONIC_VERSION_REGRESSION_BREACH')) {
      t4Passed = true;
      t4Sig = 'MONOTONIC_VERSION_REGRESSION_BREACH';
    }
  }
  const t4Dur = performance.now() - t4Start;
  results.push(
    GauntletTrapResultSchema.parse({
      trapId: 'TRAP_4_MONOTONIC_VERSION_REGRESSION',
      stageName: 'STAGE 4: MONOTONIC VERSION REGRESSION FENCE',
      targetUnit: '22.payload.unit / 16.ledger.unit',
      passed: t4Passed,
      caughtExceptionSignature: t4Sig || 'NONE',
      executionLatencyMs: Number(t4Dur.toFixed(3)),
      diagnosticTrace: t4Passed
        ? 'Trapped retrograde version anomaly (live < pinned).'
        : 'CRITICAL: Retrograde version regression allowed.',
    }),
  );
  console.log(`>> [STAGE_4] Monotonic Regression Trap -> ${t4Passed ? '[OK] TRAPPED' : '[FAIL] LEAKED'}`);

  // STAGE 5: Cryptographic Hash Parity Mismatch Sentinel
  const t5Start = performance.now();
  let t5Passed = false;
  let t5Sig = '';
  try {
    assertPayloadHashParity(
      '0'.repeat(64), // Divergent expected hash
      {
        seriesSlug: 'under-the-floorboards',
        sceneId: 'sc_culvert_siphon_01',
        lineId: 'line_wart_001',
        characterId: 'char_wart',
        verbatimText: 'Keep the tallow dry.',
        conditioningStrategy: 'ZERO_SHOT_WAV',
        composedDspMatrix: {
          entityId: 'char_wart',
          effectivePitchCentitones: 0,
          effectiveFormantWarpingBps: 10000,
          effectiveTonePacingBps: 10000,
          effectiveBreathinessPauseBps: 10000,
          pauseFrequencyMultiplierBps: 10000,
          effectiveVocalFryDensityBps: 0,
          estimatedDurationExpansionBps: 0,
          visceralReflexHoldFrames: 0,
          isExhaustionStrained: false,
          bannedCadences: [],
        },
        somaticMask: {
          armsAvailableBps: 10000,
          locomotionBaseline: 'bipedal',
          activeConditions: [],
          bannedKineticVerbs: [],
          opticalState: 'NORMAL',
          blindConeDegrees: 0,
          canSpeak: true,
        },
        pinnedFactVersions: {},
      },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('PAYLOAD_HASH_PARITY_BREACH')) {
      t5Passed = true;
      t5Sig = 'PAYLOAD_HASH_PARITY_BREACH';
    }
  }
  const t5Dur = performance.now() - t5Start;
  results.push(
    GauntletTrapResultSchema.parse({
      trapId: 'TRAP_5_RFC8785_HASH_PARITY_BREACH',
      stageName: 'STAGE 5: RFC 8785 CANONICAL HASH PARITY SENTINEL',
      targetUnit: '22.payload.unit',
      passed: t5Passed,
      caughtExceptionSignature: t5Sig || 'NONE',
      executionLatencyMs: Number(t5Dur.toFixed(3)),
      diagnosticTrace: t5Passed
        ? 'Trapped cryptographic payload hash divergence at byte zero.'
        : 'CRITICAL: Hash parity divergence failed to halt execution.',
    }),
  );
  console.log(`>> [STAGE_5] Hash Parity Sentinel Trap -> ${t5Passed ? '[OK] TRAPPED' : '[FAIL] LEAKED'}`);

  const totalPassed = results.filter((r) => r.passed).length;
  const isCertified = totalPassed === 5;
  const durationMs = Date.now() - startTime;

  console.log('------------------------------------------------------------');
  if (isCertified) {
    console.log(`>> [GAUNTLET PASS: 5/5 TRAPS VERIFIED AT T0 = $0.00] (${durationMs}ms)`);
  } else {
    console.error(`:: [GAUNTLET FAIL: ${totalPassed}/5 TRAPS VERIFIED] [!] ABORT`);
  }
  console.log('------------------------------------------------------------');

  const summary: SomaticGauntletSummary = {
    suiteId: '299.lore.somatic.gauntlet.v1',
    totalTraps: 5,
    trapsPassed: totalPassed,
    isCertified,
    totalExecutionDurationMs: durationMs,
    results,
    evaluatedAtEpoch: epoch,
  };

  return Object.freeze(SomaticGauntletSummarySchema.parse(summary));
}

// Direct CLI invocation
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] === fileURLToPath(import.meta.url)) {
  const summary = runSomaticGauntlet();
  if (!summary.isCertified) {
    process.exit(1);
  }
}
