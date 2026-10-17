import * as fs from 'node:fs'
import * as path from 'node:path'
import { DialogueLineAST, ErrorSignatureVector } from '../types/dialogueAst.js'

export interface LexicalGateOptions {
    ontologyPath?: string
}

export interface LexicalAuditResult {
    valid: boolean
    selfReportedActions: string[]
    extractedProseActions: string[]
    combinedActions: string[]
    bannedViolations: string[]
    errorVector?: ErrorSignatureVector
}

export class LexicalGate {
    private verbFamilies: Record<string, any>
    private abstractWhitelist: Set<string>
    private lemmaToFamily: Map<string, string>

    constructor(options: LexicalGateOptions = {}) {
        const defaultPath = path.resolve(
            __dirname,
            '../../schemas/ontology/verb_families.json',
        )
        const ontologyRaw = fs.readFileSync(
            options.ontologyPath || defaultPath,
            'utf8',
        )
        const parsed = JSON.parse(ontologyRaw)

        this.verbFamilies = parsed.families || {}
        this.abstractWhitelist = new Set(
            (parsed.abstract_dobj_whitelist || []).map((w: string) =>
                w.toLowerCase(),
            ),
        )
        this.lemmaToFamily = new Map()

        for (const [familyName, family] of Object.entries(this.verbFamilies)) {
            for (const lemma of family.lemmas) {
                this.lemmaToFamily.set(lemma.toLowerCase(), familyName)
            }
        }
    }

    /**
     * Extracts action verbs from natural language prose while disambiguating
     * polarity negations and abstract direct objects (e.g., "clutching fate")
     */
    public extractProseActions(prose: string): string[] {
        const actions: string[] = []
        const normalized = prose.toLowerCase().replace(/[^\w\s]/g, ' ')
        const words = normalized.split(/\s+/).filter(Boolean)

        for (let i = 0; i < words.length; i++) {
            const word = words[i]

            let matchedLemma: string | null = null
            if (this.lemmaToFamily.has(word)) {
                matchedLemma = word
            } else {
                for (const lemma of this.lemmaToFamily.keys()) {
                    if (word.startsWith(lemma)) {
                        matchedLemma = lemma
                        break
                    }
                }
            }

            if (matchedLemma) {
                // Polarity negation check: check if preceded by "not", "couldn't", "never", "cannot"
                const prevWord = i > 0 ? words[i - 1] : ''
                const prevPrevWord = i > 1 ? words[i - 2] : ''
                const isNegated =
                    prevWord === 'not' ||
                    prevWord === 'couldn' ||
                    prevWord === 'cannot' ||
                    prevWord === 'never' ||
                    (prevPrevWord === 'could' && prevWord === 'not')

                if (isNegated) {
                    continue // Negated action is legally bypassed
                }

                // Direct object abstract disambiguation check: inspect subsequent word
                const nextWord = i + 1 < words.length ? words[i + 1] : ''
                const nextNextWord = i + 2 < words.length ? words[i + 2] : ''

                if (
                    this.abstractWhitelist.has(nextWord) ||
                    this.abstractWhitelist.has(nextNextWord)
                ) {
                    continue // Metaphorical/abstract action bypassed
                }

                actions.push(matchedLemma.toUpperCase())
            }
        }

        return Array.from(new Set(actions))
    }

    /**
     * Enforces Union-Intersection Discrepancy Formulation:
     * CombinedActions = Actions_self_reported UNION Actions_prose_extracted
     * Assert: CombinedActions INTERSECT BannedVerbs(Subject) === EmptySet
     */
    public auditTurn(
        line: DialogueLineAST,
        bannedKineticVerbs: string[],
        localDbQuery?: (entityId: string) => string[],
    ): LexicalAuditResult {
        const effectiveBanned = new Set(
            (localDbQuery
                ? localDbQuery(line.speaker_id)
                : bannedKineticVerbs
            ).map((v) => v.toUpperCase()),
        )

        const selfReportedActions = line.extracted_motor_actions.map((a: string) =>
            a.toUpperCase(),
        )
        const extractedProseActions = this.extractProseActions(
            `${line.observable_parenthetical} ${line.dialogue_text}`,
        )

        // Union calculation
        const combinedActions = Array.from(
            new Set([...selfReportedActions, ...extractedProseActions]),
        )

        // Intersection with banned verbs
        const bannedViolations = combinedActions.filter((action) =>
            effectiveBanned.has(action),
        )

        if (bannedViolations.length > 0) {
            return {
                valid: false,
                selfReportedActions,
                extractedProseActions,
                combinedActions,
                bannedViolations,
                errorVector: {
                    domain: 'EPISTEMIC',
                    target_entity: line.speaker_id,
                    rule_id: 'BANNED_KINETIC_MOTOR_BREACH',
                    offending_tokens: bannedViolations,
                    beat_span: line.id,
                },
            }
        }

        return {
            valid: true,
            selfReportedActions,
            extractedProseActions,
            combinedActions,
            bannedViolations: [],
        }
    }
}
