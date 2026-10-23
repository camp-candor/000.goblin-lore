import { describe, it, expect, vi } from 'vitest'
import {
    compileSomaticMask,
    initVerbs,
    compileSomaticMaskVerbs,
    assertKineticVerbs,
} from '../buz/verbs.buzz'
import { VERB_FAMILIES } from '../val/verbs.val'
import { VerbsModel } from '../verbs.model'

describe('39.verbs.unit - Negative Kinetic Verb Mask Compiler', () => {
    it('contains complete closed semantic verb families with mandatory action lemmas', () => {
        expect(VERB_FAMILIES.LOCOMOTION_RAPID).toContain('SPRINT')
        expect(VERB_FAMILIES.LOCOMOTION_RAPID).toContain('VAULT')
        expect(VERB_FAMILIES.LOCOMOTION_RAPID).toContain('RAPID_STAIRS')
        expect(VERB_FAMILIES.LOCOMOTION_VERTICAL).toContain('CLIMB')
        expect(VERB_FAMILIES.LOCOMOTION_VERTICAL).toContain('SCALE')
        expect(VERB_FAMILIES.BIMANUAL_GRIP).toContain('BIMANUAL_LIFT')
        expect(VERB_FAMILIES.BIMANUAL_GRIP).toContain('WIELD_TWO_HANDED')
        expect(VERB_FAMILIES.MANIPULATION_FINE).toContain('PICK_LOCK')
        expect(VERB_FAMILIES.VOCAL_DELIVERY).toContain('SPEAK')
        expect(VERB_FAMILIES.VOCAL_DELIVERY).toContain('SHOUT')
        expect(VERB_FAMILIES.SUSPICION_AND_AVOIDANCE).toContain('REFUSE_DRINK')
    })

    it('inherits BIMANUAL_GRIP parent family when arm capacity drops below 20000 bps (1 arm available)', () => {
        const mask = compileSomaticMask(
            'char_wart',
            ['SEVERED_LEFT_ARM'],
            10000, // 1 arm in bps
            2,
            'UNRESTRICTED',
        )

        expect(mask.activeConditions).toContain('SEVERED_LEFT_ARM')
        expect(mask.bannedKineticVerbs).toContain('BIMANUAL_LIFT')
        expect(mask.bannedKineticVerbs).toContain('WIELD_TWO_HANDED')
        expect(mask.bannedKineticVerbs).toContain('CLIMB')
        expect(mask.bannedKineticVerbs).toContain('HEAVE')
        expect(mask.bannedKineticVerbs).not.toContain('SPRINT')
    })

    it('compiles exactly 24 negative lemmas for Wart with SEVERED_LEFT_ARM and LIMPING locomotion', () => {
        const mask = compileSomaticMask(
            'char_wart',
            ['SEVERED_LEFT_ARM'],
            10000,
            2,
            'LIMPING',
        )

        expect(mask.bannedKineticVerbs).toHaveLength(24)
        expect(mask.bannedKineticVerbs).toContain('BIMANUAL_LIFT')
        expect(mask.bannedKineticVerbs).toContain('CLIMB')
        expect(mask.bannedKineticVerbs).toContain('SPRINT')
        expect(mask.bannedKineticVerbs).toContain('VAULT')
        expect(mask.bannedKineticVerbs).not.toContain('WALK')
        expect(mask.bannedKineticVerbs).not.toContain('STAND')
    })

    it('bans fine manipulation and grasp verbs when upper limb capacity is zero (0 bps)', () => {
        const mask = compileSomaticMask(
            'char_sessile_worm',
            [],
            0, // 0 arms
            0,
            'SESSILE',
        )

        expect(mask.bannedKineticVerbs).toContain('PICK_LOCK')
        expect(mask.bannedKineticVerbs).toContain('THREAD_NEEDLE')
        expect(mask.bannedKineticVerbs).toContain('GRASP')
        expect(mask.bannedKineticVerbs).toContain('HOLD')
        expect(mask.bannedKineticVerbs).toContain('WALK')
        expect(mask.bannedKineticVerbs).toContain('STAND')
    })

    it('bans rapid locomotion verbs when locomotionTier is LIMPING or FRACTURED_FEMUR is present', () => {
        const maskLimp = compileSomaticMask(
            'char_spleen',
            ['FRACTURED_FEMUR'],
            20000,
            1,
            'LIMPING',
        )

        expect(maskLimp.bannedKineticVerbs).toContain('SPRINT')
        expect(maskLimp.bannedKineticVerbs).toContain('VAULT')
        expect(maskLimp.bannedKineticVerbs).toContain('LEAP')
        expect(maskLimp.bannedKineticVerbs).toContain('RAPID_STAIRS')
    })

    it('performs O(1) set-intersection check and rejects breached actions with pure 7-bit ASCII logs', async () => {
        const model = new VerbsModel()
        initVerbs(model, { idx: 'init' }, {} as any)

        const mockHunt = vi.fn().mockResolvedValue({})
        const mockState = { hunt: mockHunt } as any

        compileSomaticMaskVerbs(
            model,
            {
                idx: 'comp-wart',
                dat: {
                    entityId: 'char_wart',
                    conditions: ['SEVERED_LEFT_ARM'],
                    availableArmsBps: 10000,
                    legsAvailable: 2,
                    locomotionTier: 'UNRESTRICTED',
                },
            },
            mockState,
        )

        let receipt: any
        await assertKineticVerbs(
            model,
            {
                idx: 'audit-wart',
                dat: {
                    entityId: 'char_wart',
                    candidateVerbs: ['SPEAK', 'CLIMB', 'LOOK', 'BIMANUAL_LIFT'],
                },
                slv: (res: any) => {
                    receipt = res.vrbBit.dat
                },
            },
            mockState,
        )

        expect(receipt.allowed).toBe(false)
        expect(receipt.breachedVerbs).toEqual(['BIMANUAL_LIFT', 'CLIMB'])
        expect(mockHunt).toHaveBeenCalledWith(
            '[Console action] Update Console',
            expect.objectContaining({
                idx: 'cns00',
                src: expect.stringContaining(
                    '>> [SOMATIC_CAPABILITY_BREACH] Actor char_wart attempted banned verb(s): [BIMANUAL_LIFT, CLIMB]',
                ),
            }),
        )
    })

    it('allows legal actions when candidate verbs do not intersect with the banned mask', async () => {
        const model = new VerbsModel()
        initVerbs(model, { idx: 'init' }, {} as any)

        compileSomaticMaskVerbs(
            model,
            {
                idx: 'comp-wart',
                dat: {
                    entityId: 'char_wart',
                    conditions: ['SEVERED_LEFT_ARM'],
                    availableArmsBps: 10000,
                    legsAvailable: 2,
                    locomotionTier: 'UNRESTRICTED',
                },
            },
            {} as any,
        )

        let receipt: any
        await assertKineticVerbs(
            model,
            {
                idx: 'audit-legal',
                dat: {
                    entityId: 'char_wart',
                    candidateVerbs: ['SPEAK', 'WALK', 'LIMP'],
                },
                slv: (res: any) => {
                    receipt = res.vrbBit.dat
                },
            },
            {} as any,
        )

        expect(receipt.allowed).toBe(true)
        expect(receipt.breachedVerbs).toEqual([])
    })
})
