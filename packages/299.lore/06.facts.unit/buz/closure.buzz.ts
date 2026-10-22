import { FactNodeSchema, FACT_NODE_KEY_SET } from '../facts.model.js'
import type {
    FactClosureValidationResult,
    FactNodeBit,
} from '../fce/factNode.bit.js'

/**
 * Synchronous in-memory schema closure and key isolation engine.
 * Emits strictly 7-bit ASCII diagnostic receipts.
 */
export class ClosureGateBuzz {
    /**
     * Fast property-name scan checking for extraneous keys before Zod parsing.
     */
    public static detectExtraneousKeys(
        candidate: Record<string, unknown>,
    ): string[] {
        if (!candidate || typeof candidate !== 'object') {
            return []
        }
        const candidateKeys = Object.keys(candidate)
        const extraneous: string[] = []
        for (const key of candidateKeys) {
            if (!FACT_NODE_KEY_SET.has(key)) {
                extraneous.push(key)
            }
        }
        return extraneous
    }

    /**
     * Evaluates candidate fact object against closed schema contract.
     */
    public static validateFactClosure(
        candidate: unknown,
    ): FactClosureValidationResult {
        if (
            !candidate ||
            typeof candidate !== 'object' ||
            Array.isArray(candidate)
        ) {
            return {
                raw: candidate,
                reason: 'Candidate fact node must be a non-null object literal',
                unrecognizedKeys: [],
                errorCode: 'INVALID_TYPE',
                isValid: false,
            }
        }

        const extraneous = this.detectExtraneousKeys(
            candidate as Record<string, unknown>,
        )
        if (extraneous.length > 0) {
            return {
                raw: candidate,
                reason: `Schema closure breach: Unrecognized keys detected [${extraneous.join(', ')}]`,
                unrecognizedKeys: extraneous,
                errorCode: 'UNRECOGNIZED_KEYS',
                isValid: false,
            }
        }

        const parseResult = FactNodeSchema.safeParse(candidate)
        if (!parseResult.success) {
            const issue = parseResult.error.issues[0]
            const code =
                issue.code === 'unrecognized_keys'
                    ? 'UNRECOGNIZED_KEYS'
                    : 'MISSING_MANDATORY_FIELD'

            return {
                raw: candidate,
                reason: issue.message,
                unrecognizedKeys: (issue as { keys?: string[] }).keys ?? [],
                errorCode: code,
                isValid: false,
            }
        }

        return {
            data: parseResult.data as FactNodeBit,
            propertyCount: 11,
            isValid: true,
        }
    }

    /**
     * Asserts whether candidate fact satisfies strict closure, throwing formatted Error on failure.
     */
    public static assertFactClosure(
        candidate: unknown,
    ): asserts candidate is FactNodeBit {
        const result = this.validateFactClosure(candidate)
        if (!result.isValid) {
            throw new Error(
                `[SCHEMA_CLOSURE_FAIL] Closure invariant breach: ${result.reason} (code: ${result.errorCode})`,
            )
        }
    }

    /**
     * Deep freezes a validated FactNodeBit in memory.
     */
    public static sealFactNode(node: FactNodeBit): Readonly<FactNodeBit> {
        return Object.freeze({ ...node })
    }
}
