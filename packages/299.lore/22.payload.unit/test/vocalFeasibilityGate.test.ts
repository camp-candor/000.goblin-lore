import { describe, it, expect } from 'vitest'
import { assertVocalMotorFeasibility } from '../buz/vocalFeasibilityGate.buzz.js'
import {
    VocalFeasibilityCandidateSchema,
    type VocalFeasibilityCandidate,
} from '../val/aphoniaGate.val.js'
import { PayloadModel } from '../payload.model.js'
import { initPayload, verifyVocalFeasibility } from '../payload.buzzer.js'

describe('22.payload.unit :: Task 6.2 Integrate Aphonia Vocal-Motor Feasibility Gate', () => {
    const healthyActor: VocalFeasibilityCandidate = {
        entityId: 'char_bog',
        verbatimText: 'Move the lever now.',
        activeConditions: [],
        bannedKineticVerbs: [],
        isNonVerbalExpression: false,
    }

    it('certifies vocal feasibility for uninjured actors with verbal text', () => {
        const receipt = assertVocalMotorFeasibility(healthyActor, 10)
        expect(receipt.status).toBe('VALID')
        expect(receipt.isPhonationFeasible).toBe(true)
        expect(receipt.isAphonic).toBe(false)
        expect(receipt.matchedAphonicConditions).toEqual([])
        expect(receipt.matchedBannedVerbs).toEqual([])
        expect(Object.isFrozen(receipt)).toBe(true)
    })

    it('fails closed with VOCAL_DELIVERY_BREACH when an actor with crushed larynx attempts dialogue', () => {
        const injuredActor: VocalFeasibilityCandidate = {
            entityId: 'char_wart',
            verbatimText: 'I can still whisper.',
            activeConditions: ['cnd_crushed_larynx'],
            bannedKineticVerbs: [],
            isNonVerbalExpression: false,
        }

        expect(() => assertVocalMotorFeasibility(injuredActor)).toThrowError(
            /VOCAL_DELIVERY_BREACH: Character \[char_wart\] is physically aphonic \(CONDITIONS:\[cnd_crushed_larynx\]\) but verbal text was directed/,
        )
    })

    it('fails closed when kinetic action mask bans the verb "speak"', () => {
        const silencedActor: VocalFeasibilityCandidate = {
            entityId: 'char_spleen',
            verbatimText: 'Listen to the pipes.',
            activeConditions: [],
            bannedKineticVerbs: ['speak', 'shout'],
            isNonVerbalExpression: false,
        }

        expect(() => assertVocalMotorFeasibility(silencedActor)).toThrowError(
            /VOCAL_DELIVERY_BREACH: Character \[char_spleen\] is physically aphonic \(BANNED_VERBS:\[speak, shout\]\) but verbal text was directed/,
        )
    })

    it('permits aphonic actors to execute non-verbal expressions or empty dialogue cues', () => {
        const silentMuteActor: VocalFeasibilityCandidate = {
            entityId: 'char_wart',
            verbatimText: '',
            activeConditions: ['mute', 'cnd_vocal_cord_transected'],
            bannedKineticVerbs: ['speak'],
            isNonVerbalExpression: true,
        }

        const receipt = assertVocalMotorFeasibility(silentMuteActor, 20)
        expect(receipt.status).toBe('VALID')
        expect(receipt.isAphonic).toBe(true)
        expect(receipt.hasVerbalDirectives).toBe(false)
        expect(receipt.isPhonationFeasible).toBe(true)
    })

    it('rejects candidate payloads violating closed Zod schemas (.strict())', () => {
        const roguePayload = {
            ...healthyActor,
            unauthorizedField: 'ILLEGAL_VALUE',
        }
        expect(() =>
            VocalFeasibilityCandidateSchema.parse(roguePayload),
        ).toThrow()
    })

    it('executes vocal feasibility verification buzzer through PayloadModel flow', () => {
        const model = new PayloadModel()
        initPayload(model, { idx: 'init' }, {} as any)

        let emittedReceipt: any
        verifyVocalFeasibility(
            model,
            {
                idx: 'feasibility-test',
                dat: { candidate: healthyActor, epoch: 5 },
                slv: (res) => {
                    emittedReceipt = res.aphBit?.dat
                },
            },
            { hunt: async () => {} } as any,
        )

        expect(emittedReceipt).toBeDefined()
        expect(emittedReceipt.status).toBe('VALID')
        expect(model.feasibilityReceipts['char_bog']).toBeDefined()
    })
})
