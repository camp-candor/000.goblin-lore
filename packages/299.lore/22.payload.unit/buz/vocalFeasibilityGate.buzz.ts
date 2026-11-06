import {
    VocalFeasibilityCandidateSchema,
    VocalFeasibilityReceiptSchema,
    CANONICAL_APHONIC_CONDITIONS,
    BANNED_SPEAK_VERBS,
    type VocalFeasibilityCandidate,
    type VocalFeasibilityReceipt,
} from '../val/aphoniaGate.val.js'

export function assertVocalMotorFeasibility(
    candidateInput: VocalFeasibilityCandidate,
    epoch: number = 0,
): VocalFeasibilityReceipt {
    const candidate = VocalFeasibilityCandidateSchema.parse(candidateInput)

    const normalizedConditions = candidate.activeConditions.map((c) =>
        c.trim().toLowerCase(),
    )
    const normalizedVerbs = candidate.bannedKineticVerbs.map((v) =>
        v.trim().toLowerCase(),
    )

    const matchedAphonicConditions = normalizedConditions.filter((c) =>
        CANONICAL_APHONIC_CONDITIONS.some(
            (aphonic) => aphonic === c || c.includes(aphonic),
        ),
    )

    const matchedBannedVerbs = normalizedVerbs.filter((v) =>
        BANNED_SPEAK_VERBS.some((banned) => banned === v),
    )

    const isAphonic =
        matchedAphonicConditions.length > 0 || matchedBannedVerbs.length > 0
    const hasVerbalDirectives =
        candidate.verbatimText.trim().length > 0 &&
        !candidate.isNonVerbalExpression

    if (isAphonic && hasVerbalDirectives) {
        const reasons: string[] = []
        if (matchedAphonicConditions.length > 0) {
            reasons.push(`CONDITIONS:[${matchedAphonicConditions.join(', ')}]`)
        }
        if (matchedBannedVerbs.length > 0) {
            reasons.push(`BANNED_VERBS:[${matchedBannedVerbs.join(', ')}]`)
        }

        const breachMessage = `VOCAL_DELIVERY_BREACH: Character [${candidate.entityId}] is physically aphonic (${reasons.join(' | ')}) but verbal text was directed`
        throw new Error(breachMessage)
    }

    const receipt: VocalFeasibilityReceipt = {
        entityId: candidate.entityId,
        isPhonationFeasible: !isAphonic || !hasVerbalDirectives,
        isAphonic,
        matchedAphonicConditions: Object.freeze(
            matchedAphonicConditions.sort(),
        ),
        matchedBannedVerbs: Object.freeze(matchedBannedVerbs.sort()),
        hasVerbalDirectives,
        status: 'VALID',
        verifiedAtEpoch: epoch,
    }

    return Object.freeze(VocalFeasibilityReceiptSchema.parse(receipt))
}
