import { describe, it, expect } from 'vitest'
import {
    evaluateSceneSomaticStaleness,
    buildPinnedFactDictionary,
} from '../buz/pinSomaticFactVersion.buzz.js'
import {
    assertIntegerMetric,
    type StalenessEvaluationInput,
} from '../val/factPinning.val.js'
import { PayloadModel } from '../payload.model.js'
import { initPayload, checkSceneSomaticStaleness } from '../payload.buzzer.js'

describe('22.payload.unit :: Task 6.3 Monotonic Fact Version Dependency Pinning', () => {
    const samplePinnedInput: StalenessEvaluationInput = {
        sceneId: 'sc_culvert_siphon_02',
        pinnedFacts: [
            {
                factId: 'fact_wart_arm_severed',
                pinnedVersion: 2,
                pinnedHash: 'a'.repeat(64),
                claimText: 'Wart severed left arm below elbow.',
                scope: 'CHARACTER',
            },
            {
                factId: 'fact_culvert_valve_intact',
                pinnedVersion: 1,
                pinnedHash: 'b'.repeat(64),
                claimText: 'Culvert valve sealed against brine backflow.',
                scope: 'LOCATION',
            },
        ],
        liveLedgerFacts: {
            fact_wart_arm_severed: {
                factId: 'fact_wart_arm_severed',
                currentVersion: 2,
                contentHash: 'a'.repeat(64),
                claimText: 'Wart severed left arm below elbow.',
                isRetired: false,
            },
            fact_culvert_valve_intact: {
                factId: 'fact_culvert_valve_intact',
                currentVersion: 1,
                contentHash: 'b'.repeat(64),
                claimText: 'Culvert valve sealed against brine backflow.',
                isRetired: false,
            },
        },
    }

    it('asserts integer metric invariants and prohibits floating-point numbers', () => {
        expect(() => assertIntegerMetric(2, 'pinnedVersion')).not.toThrow()
        expect(() => assertIntegerMetric(2.5, 'pinnedVersion')).toThrowError(
            '[FLOAT_PROHIBITED]',
        )
        expect(() => assertIntegerMetric(NaN, 'pinnedVersion')).toThrowError(
            '[FLOAT_PROHIBITED]',
        )
    })

    it('certifies a scene as CLEAN when all pinned fact versions match live ledger', () => {
        const receipt = evaluateSceneSomaticStaleness(samplePinnedInput, 100)

        expect(receipt.sceneId).toBe('sc_culvert_siphon_02')
        expect(receipt.isDirty).toBe(false)
        expect(receipt.staleFactCount).toBe(0)
        expect(receipt.diffs).toEqual([])
        expect(receipt.status).toBe('CLEAN')
        expect(Object.isFrozen(receipt)).toBe(true)
    })

    it('flags a scene as DIRTY when an upstream fact version increments', () => {
        const mutatedInput: StalenessEvaluationInput = {
            ...samplePinnedInput,
            liveLedgerFacts: {
                ...samplePinnedInput.liveLedgerFacts,
                fact_wart_arm_severed: {
                    factId: 'fact_wart_arm_severed',
                    currentVersion: 3,
                    contentHash: 'c'.repeat(64),
                    claimText: 'Wart left arm amputated at shoulder joint.',
                    isRetired: false,
                },
            },
        }

        const receipt = evaluateSceneSomaticStaleness(mutatedInput, 105)

        expect(receipt.isDirty).toBe(true)
        expect(receipt.staleFactCount).toBe(1)
        expect(receipt.status).toBe('DIRTY_PENDING_REVALIDATION')
        expect(receipt.diffs.length).toBe(1)

        const diff = receipt.diffs[0]
        expect(diff.factId).toBe('fact_wart_arm_severed')
        expect(diff.pinnedVersion).toBe(2)
        expect(diff.liveVersion).toBe(3)
        expect(diff.invalidationReason).toContain('v2 -> v3')
        expect(diff.invalidationReason).toContain(
            'Old: [Wart severed left arm below elbow.]',
        )
        expect(diff.invalidationReason).toContain(
            'New: [Wart left arm amputated at shoulder joint.]',
        )
    })

    it('flags a scene as DIRTY when a pinned fact is retired in the live ledger', () => {
        const retiredInput: StalenessEvaluationInput = {
            ...samplePinnedInput,
            liveLedgerFacts: {
                ...samplePinnedInput.liveLedgerFacts,
                fact_culvert_valve_intact: {
                    factId: 'fact_culvert_valve_intact',
                    currentVersion: 2,
                    contentHash: 'd'.repeat(64),
                    claimText: 'Culvert valve destroyed by pressure hammer.',
                    isRetired: true,
                },
            },
        }

        const receipt = evaluateSceneSomaticStaleness(retiredInput, 110)
        expect(receipt.isDirty).toBe(true)
        expect(receipt.diffs[0].isRetired).toBe(true)
        expect(receipt.diffs[0].invalidationReason).toContain('retired')
    })

    it('aborts with MONOTONIC_VERSION_REGRESSION_BREACH if pinned version exceeds live version', () => {
        const retrogradeInput: StalenessEvaluationInput = {
            ...samplePinnedInput,
            liveLedgerFacts: {
                ...samplePinnedInput.liveLedgerFacts,
                fact_wart_arm_severed: {
                    factId: 'fact_wart_arm_severed',
                    currentVersion: 1, // Live version is less than pinned version 2
                    contentHash: 'e'.repeat(64),
                    claimText: 'Earlier draft claim.',
                    isRetired: false,
                },
            },
        }

        expect(() =>
            evaluateSceneSomaticStaleness(retrogradeInput),
        ).toThrowError(/MONOTONIC_VERSION_REGRESSION_BREACH/)
    })

    it('builds a frozen dictionary of pinned fact versions', () => {
        const dict = buildPinnedFactDictionary([
            {
                factId: 'fact_one',
                version: 1,
                hash: 'a'.repeat(64),
                claimText: 'Claim 1',
            },
            {
                factId: 'fact_two',
                version: 4,
                hash: 'b'.repeat(64),
                claimText: 'Claim 2',
            },
        ])

        expect(dict['fact_one']).toBe(1)
        expect(dict['fact_two']).toBe(4)
        expect(Object.isFrozen(dict)).toBe(true)
    })

    it('executes somatic staleness evaluation buzzer through PayloadModel flow', async () => {
        const model = new PayloadModel()
        initPayload(model, { idx: 'init' }, {} as any)

        let emittedReceipt: any
        checkSceneSomaticStaleness(
            model,
            {
                idx: 'staleness-test',
                dat: { input: samplePinnedInput, epoch: 50 },
                slv: (res) => {
                    emittedReceipt = res.pinBit?.dat
                },
            },
            { hunt: async () => {} } as any,
        )

        expect(emittedReceipt).toBeDefined()
        expect(emittedReceipt.isDirty).toBe(false)
        expect(model.stalenessReceipts['sc_culvert_siphon_02']).toBeDefined()
    })
})
