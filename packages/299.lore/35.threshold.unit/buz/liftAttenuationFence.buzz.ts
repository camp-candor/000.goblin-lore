export interface AttenuationFenceLiftReceipt {
    entityId: string
    tokensRemoved: string[]
    remainingTokens: string[]
    isBreakStateAuthorized: boolean
}

export function executeAttenuationFenceLift(
    entityId: string,
    existingTokens: readonly string[],
    bannedTokensRemoved: readonly string[],
): AttenuationFenceLiftReceipt {
    const removalSet = new Set(
        bannedTokensRemoved.map((t) => t.trim().toLowerCase()),
    )
    const remainingTokens: string[] = []
    const tokensRemoved: string[] = []

    for (const token of existingTokens) {
        const normalized = token.trim().toLowerCase()
        if (removalSet.has(normalized)) {
            tokensRemoved.push(normalized)
        } else {
            remainingTokens.push(normalized)
        }
    }

    return Object.freeze({
        entityId,
        tokensRemoved: Object.freeze(tokensRemoved.sort()),
        remainingTokens: Object.freeze(remainingTokens.sort()),
        isBreakStateAuthorized: true,
    })
}
