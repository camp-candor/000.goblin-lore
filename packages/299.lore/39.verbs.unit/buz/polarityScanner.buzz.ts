import {
    ABSTRACT_DOBJ_WHITELIST,
    NEGATION_MODIFIERS,
    PHRASAL_VERB_COLLAPSE_MAP,
    type ParsedActionClause,
    type PolarityScanResult,
    type ErrorSignatureVector,
    type PolarityClassification,
} from '../val/polarity.val'
import { VERB_FAMILIES } from '../val/verbs.val'
import type { ScanProsePolarityPayload } from '../fce/polarity.bit'

const ABSTRACT_SET = new Set<string>(ABSTRACT_DOBJ_WHITELIST)

/**
 * Normalizes multi-word phrasal idioms before dependency parsing.
 */
export function harmonizeDialectAndPhrasals(text: string): string {
    let normalized = text.toUpperCase()
    for (const [phrasal, replacement] of Object.entries(
        PHRASAL_VERB_COLLAPSE_MAP,
    )) {
        normalized = normalized.split(phrasal).join(replacement)
    }
    return normalized
}

/**
 * Splits prose text into discrete, analyzeable sentences and clauses.
 */
export function splitClauses(prose: string): string[] {
    return prose
        .replace(/\r\n/g, '\n')
        .split(/(?<=[.!?])\s+|\n+/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
}

/**
 * Checks if a token is a morphological inflection of a given lemma.
 */
function matchesLemma(token: string, lemma: string): boolean {
    if (token === lemma) return true
    if (token === lemma + 'S') return true
    if (token === lemma + 'ES') return true
    if (token === lemma + 'ED') return true
    if (lemma.endsWith('E') && token === lemma + 'D') return true
    if (token === lemma + lemma.slice(-1) + 'ED') return true
    if (token === lemma + 'ING') return true
    if (lemma.endsWith('E') && token === lemma.slice(0, -1) + 'ING') return true
    if (token === lemma + lemma.slice(-1) + 'ING') return true
    return false
}

/**
 * Scans a single clause to bind subject, verb lemma, direct object, and polarity.
 */
export function parseClauseDependency(
    clause: string,
    targetEntity: string,
    targetName: string,
    targetAliases: string[] = [],
    bannedSet: Set<string>,
): ParsedActionClause | null {
    const harmonized = harmonizeDialectAndPhrasals(clause)
    const cleanAscii = harmonized.replace(/[^A-Z0-9_\s]/g, ' ')
    const tokens = cleanAscii.split(/\s+/).filter((t) => t.length > 0)

    if (tokens.length === 0) return null

    const upperName = targetName.toUpperCase()
    const upperAliases = targetAliases.map((a) => a.toUpperCase())
    const allNames = new Set([
        upperName,
        targetEntity.toUpperCase(),
        ...upperAliases,
    ])

    // Check for passive causative construction (e.g., "Bog was hoisted by Wart")
    const wasIndex = tokens.indexOf('WAS')
    const byIndex = tokens.indexOf('BY')
    const isPassive = wasIndex !== -1 && byIndex !== -1 && byIndex > wasIndex

    // Identify candidate verbs present in the closed verb ontology or banned set
    let detectedVerb: string | null = null
    let verbIndex = -1

    // Check banned set first
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]
        for (const b of bannedSet) {
            if (matchesLemma(t, b)) {
                detectedVerb = b
                verbIndex = i
                break
            }
        }
        if (detectedVerb) break
    }

    // If no banned verb, cross-check all verb family buckets
    if (!detectedVerb) {
        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i]
            for (const family of Object.values(VERB_FAMILIES)) {
                for (const v of family as readonly string[]) {
                    if (matchesLemma(t, v)) {
                        detectedVerb = v
                        verbIndex = i
                        break
                    }
                }
                if (detectedVerb) break
            }
            if (detectedVerb) break
        }
    }

    if (!detectedVerb || verbIndex === -1) {
        return null
    }

    // Extract grammatical subject candidate before verb
    let subject = 'UNKNOWN'
    for (let i = 0; i < verbIndex; i++) {
        const t = tokens[i]
        if (allNames.has(t)) {
            subject = targetEntity
            break
        }
        if (t === 'HE' || t === 'SHE' || t === 'THEY') {
            subject = 'PRONOUN_COREFERENCE'
            break
        }
        if (t === 'SOMEONE' || t === 'FIGURE' || t === 'ANYONE') {
            subject = 'AMBIGUOUS_AGENT'
            break
        }
    }

    // Handle passive patient: Target was acted upon by someone else
    if (isPassive && (subject === targetEntity || allNames.has(tokens[0]))) {
        return {
            rawClause: clause,
            subject: targetEntity,
            verbLemma: detectedVerb,
            directObject: null,
            polarity: 'PASSIVE_PATIENT',
            isNegated: true,
            isAbstractMetaphor: false,
            confidence: 1.0,
        }
    }

    // Ambiguous agent handling (fails closed)
    if (subject === 'AMBIGUOUS_AGENT') {
        return {
            rawClause: clause,
            subject: 'AMBIGUOUS_AGENT',
            verbLemma: detectedVerb,
            directObject: null,
            polarity: 'AMBIGUOUS_COREFERENCE',
            isNegated: false,
            isAbstractMetaphor: false,
            confidence: 0.5,
        }
    }

    // If the clause does not name target before verb, acted by another actor
    if (subject === 'UNKNOWN') {
        return {
            rawClause: clause,
            subject: 'OTHER_ENTITY',
            verbLemma: detectedVerb,
            directObject: null,
            polarity: 'NEGATED', // Non-breaching for target entity
            isNegated: true,
            isAbstractMetaphor: false,
            confidence: 0.95,
        }
    }

    // Extract direct object (dobj) in lookahead window (up to 4 tokens following verb)
    let directObject: string | null = null
    let isAbstractMetaphor = false
    for (
        let i = verbIndex + 1;
        i < Math.min(tokens.length, verbIndex + 5);
        i++
    ) {
        const candidateDobj = tokens[i]
        // If the path to candidate includes spatial trajectory preposition 'ACROSS', skip metaphor classification
        if (tokens.slice(verbIndex + 1, i).includes('ACROSS')) {
            continue
        }
        if (ABSTRACT_SET.has(candidateDobj)) {
            directObject = candidateDobj
            isAbstractMetaphor = true
            break
        }
    }

    if (isAbstractMetaphor) {
        return {
            rawClause: clause,
            subject: targetEntity,
            verbLemma: detectedVerb,
            directObject,
            polarity: 'METAPHORICAL',
            isNegated: true,
            isAbstractMetaphor: true,
            confidence: 0.99,
        }
    }

    // Lookback window for negative polarity modifiers (up to 6 tokens preceding verb)
    let isNegated = false
    const lookbackTokens = tokens.slice(Math.max(0, verbIndex - 6), verbIndex)
    const lookbackString = lookbackTokens.join(' ')

    for (const neg of NEGATION_MODIFIERS) {
        if (lookbackString.includes(neg)) {
            isNegated = true
            break
        }
    }

    // Check for immediate privative preposition "WITHOUT" right before the verb
    if (lookbackString.endsWith('WITHOUT')) {
        isNegated = true
    }

    const polarity: PolarityClassification = isNegated
        ? 'NEGATED'
        : 'AFFIRMATIVE'

    return {
        rawClause: clause,
        subject: subject === 'UNKNOWN' ? targetEntity : subject,
        verbLemma: detectedVerb,
        directObject,
        polarity,
        isNegated,
        isAbstractMetaphor: false,
        confidence: isNegated ? 0.98 : 0.95,
    }
}

/**
 * Sweeps prose body against the character's somatic capability mask.
 */
export function scanVoiceRailVerbPolarity(
    payload: ScanProsePolarityPayload,
): PolarityScanResult {
    const {
        entityId,
        characterName,
        characterAliases = [],
        markdownProse,
        bannedKineticVerbs,
    } = payload
    const bannedSet = new Set(
        bannedKineticVerbs.map((v) => v.trim().toUpperCase()),
    )
    const clauses = splitClauses(markdownProse)

    const breaches: ErrorSignatureVector[] = []
    const parsedClauses: ParsedActionClause[] = []

    for (let lineIndex = 0; lineIndex < clauses.length; lineIndex++) {
        const clauseText = clauses[lineIndex]
        const parsed = parseClauseDependency(
            clauseText,
            entityId,
            characterName,
            characterAliases,
            bannedSet,
        )

        if (!parsed) continue
        parsedClauses.push(parsed)

        // Fail-Closed Rule: Ambiguous coreference with a banned verb triggers breach for review
        if (
            parsed.polarity === 'AMBIGUOUS_COREFERENCE' &&
            bannedSet.has(parsed.verbLemma)
        ) {
            breaches.push({
                domain: 'SOMATIC',
                targetEntity: entityId,
                ruleId: 'AMBIGUOUS_COREFERENCE_BREACH',
                offendingTokens: [parsed.verbLemma],
                span: {
                    lineNumber: lineIndex + 1,
                    textSnippet: clauseText,
                },
            })
            continue
        }

        // Affirmative execution of a banned verb
        if (
            parsed.polarity === 'AFFIRMATIVE' &&
            bannedSet.has(parsed.verbLemma)
        ) {
            breaches.push({
                domain: 'SOMATIC',
                targetEntity: entityId,
                ruleId: 'FATAL_SOMATIC_PROSE_LEAK',
                offendingTokens: [parsed.verbLemma],
                span: {
                    lineNumber: lineIndex + 1,
                    textSnippet: clauseText,
                },
            })
        }
    }

    return {
        allowed: breaches.length === 0,
        targetEntity: entityId,
        breaches,
        parsedClauses,
        totalClausesEvaluated: clauses.length,
    }
}
