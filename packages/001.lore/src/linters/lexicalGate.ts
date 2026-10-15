import * as fs from 'node:fs'
import * as path from 'node:path'
import { DialogueLineAST, ErrorSignatureVector } from '../types/dialogueAst.js'

export interface VerbFamilyData {
    families: Record<
        string,
        {
            capability_required: string
            required_limbs: number
            lemmas: string[]
        }
    >
    abstract_dobj_whitelist: string[]
}

export class LexicalGate {
    private ontology: VerbFamilyData
    private lemmaToFamily: Map<string, string> = new Map()
    private abstractWhitelist: Set<string>

    constructor(ontologyPath?: string) {
        const resolvedPath =
            ontologyPath ||
            path.resolve(__dirname, '../../schemas/ontology/verb_families.json')
        const raw = fs.readFileSync(resolvedPath, 'utf8')
        this.ontology = JSON.parse(raw)
        this.abstractWhitelist = new Set(
            this.ontology.abstract_dobj_whitelist.map((w) => w.toLowerCase()),
        )

        for (const [familyKey, family] of Object.entries(
            this.ontology.families,
        )) {
            for (const lemma of family.lemmas) {
                this.lemmaToFamily.set(lemma.toLowerCase(), familyKey)
            }
        }
    }

    /**
     * Tokenizes and extracts verbs from a natural language prose parenthetical.
     */
    public extractProseVerbs(
        prose: string,
    ): Array<{ verb: string; dobj?: string; isNegated: boolean }> {
        const results: Array<{
            verb: string
            dobj?: string
            isNegated: boolean
        }> = []
        const normalized = prose.toLowerCase().replace(/[^a-z0-9_\s]/g, ' ')
        const tokens = normalized.split(/\s+/).filter((t) => t.length > 0)

        const negationTokens = new Set([
            'not',
            'never',
            'unable',
            'cannot',
            'couldnt',
            'neither',
            'hardly',
        ])

        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i]
            let lemmaMatch = token
            if (!this.lemmaToFamily.has(token)) {
                if (
                    token.endsWith('es') &&
                    this.lemmaToFamily.has(token.slice(0, -2))
                ) {
                    lemmaMatch = token.slice(0, -2)
                } else if (
                    token.endsWith('s') &&
                    this.lemmaToFamily.has(token.slice(0, -1))
                ) {
                    lemmaMatch = token.slice(0, -1)
                } else if (
                    token.endsWith('ing') &&
                    this.lemmaToFamily.has(token.slice(0, -3))
                ) {
                    lemmaMatch = token.slice(0, -3)
                } else if (
                    token.endsWith('ed') &&
                    this.lemmaToFamily.has(token.slice(0, -2))
                ) {
                    lemmaMatch = token.slice(0, -2)
                }
            }

            if (this.lemmaToFamily.has(lemmaMatch)) {
                // Lookback window for negation (up to 3 preceding tokens)
                let isNegated = false
                for (let j = Math.max(0, i - 3); j < i; j++) {
                    if (negationTokens.has(tokens[j])) {
                        isNegated = true
                        break
                    }
                }

                // Lookahead window for direct object (up to 3 succeeding tokens)
                let dobj: string | undefined = undefined
                const skipTokens = new Set([
                    'the',
                    'a',
                    'an',
                    'his',
                    'her',
                    'their',
                    'my',
                    'our',
                    'its',
                ])
                for (let k = i + 1; k < Math.min(tokens.length, i + 4); k++) {
                    if (skipTokens.has(tokens[k])) {
                        continue
                    }
                    if (!this.lemmaToFamily.has(tokens[k])) {
                        dobj = tokens[k]
                        break
                    }
                }

                results.push({ verb: lemmaMatch, dobj, isNegated })
            }
        }

        return results
    }

    /**
     * Dual-Field Cross-Check: Evaluates CombinedActions ∩ BannedVerbs(Subject)
     */
    public auditDialogueLine(
        line: DialogueLineAST,
        bannedKineticVerbs: string[],
    ): { passed: boolean; errorVector?: ErrorSignatureVector } {
        const bannedSet = new Set(
            bannedKineticVerbs.map((v) => v.toLowerCase()),
        )

        // 1. Evaluate self-reported machine AST actions
        for (const action of line.extracted_motor_actions) {
            const actionNormalized = action.toLowerCase()
            if (bannedSet.has(actionNormalized)) {
                return {
                    passed: false,
                    errorVector: {
                        domain: 'SOMATIC',
                        target_entity: line.speaker_id,
                        rule_id: 'FATAL_SOMATIC_BREACH',
                        offending_tokens: [actionNormalized],
                        span: {
                            line_id: line.id,
                            text_snippet: line.dialogue_text,
                        },
                    },
                }
            }
        }

        // 2. Extract implied prose actions across both camera and observable parentheticals
        const combinedProse = `${line.camera_parenthetical} ${line.observable_parenthetical}`
        const proseActions = this.extractProseVerbs(combinedProse)

        for (const item of proseActions) {
            if (item.isNegated) {
                // Negation filter: "could not sprint" accurately depicts inability
                continue
            }

            if (item.dobj && this.abstractWhitelist.has(item.dobj)) {
                // Abstract metaphor filter: "clutched fate" bypassed as non-physical
                continue
            }

            if (bannedSet.has(item.verb)) {
                return {
                    passed: false,
                    errorVector: {
                        domain: 'SOMATIC',
                        target_entity: line.speaker_id,
                        rule_id: 'FATAL_SOMATIC_PROSE_LEAK',
                        offending_tokens: [item.verb, item.dobj || ''],
                        span: { line_id: line.id, text_snippet: combinedProse },
                    },
                }
            }
        }

        return { passed: true }
    }
}
