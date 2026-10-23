import { describe, it, expect } from 'vitest'
import {
    SomaticArchetypeSchema,
    SomaticDeltaSchema,
    DEFAULT_ARCHETYPES,
    resolveArchetypeInheritance,
} from '../val/archetype.val.js'
import { SeriesModel } from '../series.model.js'
import { resolveArchetype } from '../buz/series.buzz.js'
import { ZodError } from 'zod'

describe('29.series.unit: Archetype Inheritance Template Schema Definition', () => {
    it('validates canonical default archetypes against SomaticArchetypeSchema', () => {
        for (const [id, arch] of Object.entries(DEFAULT_ARCHETYPES)) {
            expect(arch.archetype_id).toBe(id)
            expect(SomaticArchetypeSchema.parse(arch)).toBeDefined()
            expect(arch.base_arms_bps % 1).toBe(0)
            expect(arch.base_legs_bps % 1).toBe(0)
        }
    })

    it('negative control: rejects invalid archetype schemas', () => {
        const invalidArch = {
            archetype_id: 'INVALID_CAPS',
            species: 'non_existent_species',
            base_arms_bps: 2.0, // float rejection
            base_legs_bps: 20000,
            default_locomotion: 'bipedal_standard',
            default_banned_verbs: [],
            sensory_baselines: {
                optical_acuity_bps: 10000,
                auditory_floor_cdb: 2000,
                olfactory_acuity_bps: 5000,
            },
            description: 'Test invalid',
        }

        expect(() => SomaticArchetypeSchema.parse(invalidArch)).toThrow(
            ZodError,
        )
    })

    it('resolves archetype inheritance with clean baseline without deltas', () => {
        const base = DEFAULT_ARCHETYPES.arch_goblin_grunt
        const resolved = resolveArchetypeInheritance(base)

        expect(resolved.archetype_id).toBe('arch_goblin_grunt')
        expect(resolved.effective_arms_bps).toBe(20000)
        expect(resolved.effective_legs_bps).toBe(20000)
        expect(resolved.locomotion_baseline).toBe('bipedal_hunched')
        expect(resolved.banned_kinetic_verbs).toEqual(['sprint', 'vault'])
    })

    it('applies traumatic limb delta and enforces automatic bimanual bans', () => {
        const base = DEFAULT_ARCHETYPES.arch_goblin_grunt
        const delta = SomaticDeltaSchema.parse({
            archetype_id: 'arch_goblin_grunt',
            arms_delta_bps: -10000, // Lost 1 arm (10,000 bps)
            locomotion_override: 'limping',
            additional_banned_verbs: ['leap'],
            active_conditions: ['severed_left_arm'],
        })

        const resolved = resolveArchetypeInheritance(base, delta)

        expect(resolved.effective_arms_bps).toBe(10000)
        expect(resolved.locomotion_baseline).toBe('limping')
        expect(resolved.active_conditions).toContain('severed_left_arm')
        // Must automatically ban bimanual actions since effectiveArms < 20,000 bps
        expect(resolved.banned_kinetic_verbs).toEqual(
            expect.arrayContaining([
                'bimanual_lift',
                'dual_wield',
                'two_handed_strike',
                'leap',
                'sprint',
                'vault',
            ]),
        )
    })

    it('clamps limb capacities to zero when traumatic decrements exceed baseline', () => {
        const base = DEFAULT_ARCHETYPES.arch_goblin_grunt
        const delta = SomaticDeltaSchema.parse({
            archetype_id: 'arch_goblin_grunt',
            arms_delta_bps: -30000, // Decrement greater than base 20,000 bps
        })

        const resolved = resolveArchetypeInheritance(base, delta)
        expect(resolved.effective_arms_bps).toBe(0)
    })

    it('dispatches resolveArchetype buzz handler with valid and invalid payloads', () => {
        const model = new SeriesModel()
        const mockState = {} as any

        let successResult: any = null
        resolveArchetype(
            model,
            {
                idx: 'test_resolve_01',
                dat: {
                    archetypeId: 'arch_human_operator',
                    delta: {
                        archetype_id: 'arch_human_operator',
                        additional_banned_verbs: ['climb'],
                    },
                },
                slv: (res) => {
                    successResult = res
                },
            },
            mockState,
        )

        expect(successResult).toBeDefined()
        expect(successResult.seriesBit.val).toBe(1)
        expect(successResult.seriesBit.dat.isValid).toBe(true)
        expect(
            successResult.seriesBit.dat.resolvedProfile.banned_kinetic_verbs,
        ).toContain('climb')

        let failResult: any = null
        resolveArchetype(
            model,
            {
                idx: 'test_resolve_02',
                dat: { archetypeId: 'arch_unindexed_phantom' },
                slv: (res) => {
                    failResult = res
                },
            },
            mockState,
        )

        expect(failResult).toBeDefined()
        expect(failResult.seriesBit.val).toBe(0)
        expect(failResult.seriesBit.dat.isValid).toBe(false)
        expect(failResult.seriesBit.dat.error).toContain('[UNKNOWN_ARCHETYPE]')
    })
})
