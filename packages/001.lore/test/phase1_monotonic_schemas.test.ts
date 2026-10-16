// packages/001.lore/test/phase1_monotonic_schemas.test.ts
import { describe, expect, it } from 'vitest'
import {
    assertByteZeroFrontmatter,
    BasisPointsSchema,
    FactNodeSchema,
    verifyMonotonicFactTransition,
} from '../schemas/schemas'
import {
    DependencyEdgeSchema,
    evaluateSceneStaleness,
    SceneDependencyContractSchema,
} from '../schemas/dependencies.schema'
import { scanSourceForDeterminismViolations } from '../scripts/lint-determinism'

const VALID_HASH_V1 =
    'sha256:1111111111111111111111111111111111111111111111111111111111111111'
const VALID_HASH_V2 =
    'sha256:2222222222222222222222222222222222222222222222222222222222222222'

describe('PHASE 1: Monotonic Fact Ledger Schemas & Version-Pinned Edge Contracts', () => {
    describe('TASK-GL-MV-1.1: Byte-0 Frontmatter & Monotonic Fact Node Contracts', () => {
        it('accepts valid Byte-0 YAML frontmatter starting at index 0', () => {
            const validMarkdown = '---\nid: fact_silas_arm\n---\nBody text.'
            expect(() => assertByteZeroFrontmatter(validMarkdown)).not.toThrow()
        })

        it('rejects UTF-8 BOM and leading whitespace at Byte-0', () => {
            const bomBuffer = Buffer.from([
                0xef, 0xbb, 0xbf, 0x2d, 0x2d, 0x2d, 0x0a,
            ])
            expect(() => assertByteZeroFrontmatter(bomBuffer)).toThrow(
                /UTF-8 BOM detected/,
            )
            expect(() =>
                assertByteZeroFrontmatter(' ---\nid: test\n---'),
            ).toThrow(/Byte-0 Violation/)
            expect(() =>
                assertByteZeroFrontmatter('\n---\nid: test\n---'),
            ).toThrow(/Byte-0 Violation/)
        })

        it('enforces integer basis points (0..10000) and rejects IEEE 754 floats', () => {
            expect(BasisPointsSchema.parse(0)).toBe(0)
            expect(BasisPointsSchema.parse(10000)).toBe(10000)
            expect(() => BasisPointsSchema.parse(0.75)).toThrow(
                /Floating-point numbers are barred/,
            )
            expect(() => BasisPointsSchema.parse(-1)).toThrow()
            expect(() => BasisPointsSchema.parse(10001)).toThrow()
        })

        it('validates FactNodeSchema with .strict() and normalizes strings to NFC', () => {
            const decomposedClaim = 'Cafe\u0301 nerve damage'
            const parsed = FactNodeSchema.parse({
                id: 'fact_pilot_hand_injury',
                claim_text: decomposedClaim,
                scope: 'CHARACTER',
                authority_level: 'CANON',
                standing: 'ACTIVE_ENDORSED',
                author: 'showrunner_01',
                version: 1,
                content_hash: VALID_HASH_V1,
                severity_bps: 7500,
                confidence_bps: 10000,
                created_at_epoch: 10,
                last_edited_at_epoch: 10,
            })

            expect(parsed.claim_text).toBe(decomposedClaim.normalize('NFC'))
            expect(parsed.version).toBe(1)

            // Reject hallucinated extra keys via .strict()
            expect(() =>
                FactNodeSchema.parse({
                    id: 'fact_pilot_hand_injury',
                    claim_text: 'Claim',
                    scope: 'CHARACTER',
                    author: 'showrunner_01',
                    version: 1,
                    content_hash: VALID_HASH_V1,
                    hallucinated_field: true,
                }),
            ).toThrow()
        })

        it('enforces strict monotonic version increments (+1) on content mutation and blocks authority escalation', () => {
            const v1Fact = FactNodeSchema.parse({
                id: 'fact_silas_arm',
                claim_text: 'Silas right arm is intact.',
                scope: 'CHARACTER',
                authority_level: 'CANON',
                standing: 'ACTIVE_ENDORSED',
                author: 'showrunner',
                version: 1,
                content_hash: VALID_HASH_V1,
            })

            const v2FactValid = FactNodeSchema.parse({
                ...v1Fact,
                claim_text: 'Silas right brachial plexus is severed.',
                version: 2,
                content_hash: VALID_HASH_V2,
            })

            const transition = verifyMonotonicFactTransition(
                v1Fact,
                v2FactValid,
                'CANON',
            )
            expect(transition.versionIncremented).toBe(true)
            expect(transition.requiresCascade).toBe(true)

            // Fail when content mutates without bumping version
            const v1MutatedNoBump = { ...v2FactValid, version: 1 }
            expect(() =>
                verifyMonotonicFactTransition(v1Fact, v1MutatedNoBump, 'CANON'),
            ).toThrow(/Monotonic Version Violation/)

            // Fail when untrusted PROJECTION attempts to mutate CANON
            expect(() =>
                verifyMonotonicFactTransition(
                    v1Fact,
                    v2FactValid,
                    'PROJECTION',
                ),
            ).toThrow(/Authority Boundary Breach/)

            // Zero-Cascade Liminal Guarantee for FLAGGED_FOR_REVIEW ("Still Good" review flag)
            const flaggedFact = FactNodeSchema.parse({
                ...v1Fact,
                standing: 'FLAGGED_FOR_REVIEW',
                last_reconsidered_at_epoch: 25,
            })
            const liminalResult = verifyMonotonicFactTransition(
                v1Fact,
                flaggedFact,
                'CANON',
            )
            expect(liminalResult.versionIncremented).toBe(false)
            expect(liminalResult.requiresCascade).toBe(false)
        })
    })

    describe('TASK-GL-MV-1.2: Version-Pinned Dependency Edge & Write-Time Friction Schema', () => {
        it('rejects dependency edges missing pinned_version', () => {
            expect(() =>
                DependencyEdgeSchema.parse({
                    fact_id: 'fact_silas_arm',
                }),
            ).toThrow()
        })

        it('blocks DRAFT -> CLEAN transition when depends_on is empty and asserts_zero_dependencies is false', () => {
            expect(() =>
                SceneDependencyContractSchema.parse({
                    id: 'ep101_sc03',
                    episode_num: 101,
                    scene_num: 3,
                    prose_text: 'Silas reaches for the siphon.',
                    status: 'CLEAN',
                    is_dirty: false,
                    asserts_zero_dependencies: false,
                    depends_on: [],
                    owner_id: 'writer_01',
                }),
            ).toThrow(/Write-Time Friction Gate/)

            // Passes when pinned edge is declared
            const validCleanScene = SceneDependencyContractSchema.parse({
                id: 'ep101_sc03',
                episode_num: 101,
                scene_num: 3,
                prose_text: 'Silas reaches for the siphon.',
                status: 'CLEAN',
                is_dirty: false,
                depends_on: [
                    {
                        fact_id: 'fact_silas_arm',
                        entity_type: 'character',
                        pinned_version: 1,
                    },
                ],
                owner_id: 'writer_01',
            })
            expect(validCleanScene.status).toBe('CLEAN')
        })

        it('propagates DIRTY status when pinned_version < active fact version, but ignores FLAGGED_FOR_REVIEW', () => {
            const scene = SceneDependencyContractSchema.parse({
                id: 'ep101_sc03',
                episode_num: 101,
                scene_num: 3,
                prose_text: 'Silas climbs the ladder with both hands.',
                status: 'CLEAN',
                is_dirty: false,
                depends_on: [
                    {
                        fact_id: 'fact_silas_arm',
                        entity_type: 'character',
                        pinned_version: 1,
                    },
                ],
                owner_id: 'writer_01',
            })

            const factV1Flagged = FactNodeSchema.parse({
                id: 'fact_silas_arm',
                claim_text: 'Silas right arm is intact.',
                scope: 'CHARACTER',
                standing: 'FLAGGED_FOR_REVIEW',
                author: 'showrunner',
                version: 1,
                content_hash: VALID_HASH_V1,
            })

            const checkLiminal = evaluateSceneStaleness(
                scene,
                new Map([['fact_silas_arm', factV1Flagged]]),
            )
            expect(checkLiminal.is_dirty).toBe(false)
            expect(checkLiminal.status).toBe('CLEAN')

            const factV2Mutated = FactNodeSchema.parse({
                ...factV1Flagged,
                standing: 'ACTIVE_ENDORSED',
                claim_text: 'Silas right arm is paralyzed.',
                version: 2,
                content_hash: VALID_HASH_V2,
            })

            const checkStale = evaluateSceneStaleness(
                scene,
                new Map([['fact_silas_arm', factV2Mutated]]),
            )
            expect(checkStale.is_dirty).toBe(true)
            expect(checkStale.status).toBe('DIRTY')
            expect(checkStale.dirty_reason).toContain('v1->v2')
        })
    })

    describe('TASK-GL-MV-1.3: Volatile Contamination & Logical Clock Linter', () => {
        it('flags Date.now(), Math.random(), process.env, fetch(), mtime, and non-ASCII emojis', () => {
            const contaminatedCode = [
                'const t = Date.now();',
                'const r = Math.random();',
                'const secret = process.env.API_KEY;',
                'const res = await fetch("https://example.com");',
                'const modified = stat.mtimeMs;',
                '// Illegal emoji rocket: \uD83D\uDE80',
            ].join('\n')

            const violations = scanSourceForDeterminismViolations(
                contaminatedCode,
                'contaminated.ts',
            )
            const ruleIds = violations.map((v) => v.ruleId)

            expect(ruleIds).toContain('BAN_WALL_CLOCK')
            expect(ruleIds).toContain('BAN_MATH_RANDOM')
            expect(ruleIds).toContain('BAN_PROCESS_ENV')
            expect(ruleIds).toContain('BAN_NETWORK_IO')
            expect(ruleIds).toContain('BAN_MTIME_STAT')
            expect(ruleIds).toContain('BAN_NON_ASCII')
        })

        it('passes clean, deterministic 7-bit ASCII source files with zero violations', () => {
            const cleanCode = `
        export function nextVersion(currentVersion: number): number {
          return currentVersion + 1;
        }
      `
            const violations = scanSourceForDeterminismViolations(
                cleanCode,
                'clean.ts',
            )
            expect(violations).toHaveLength(0)
        })
    })
})
