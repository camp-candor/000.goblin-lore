/**
 * packages/299.lore/98.menu.unit/buz/15.constitutional.registry.buzz.ts
 *
 * Constitutional Rule Registry audit buzzer. Loads the canonical Phase 2
 * hard-invariant baseline rules through the strict Zod schemas, sweeps every
 * series pardon ledger from disk, and runs the real validatePass2Pardons
 * gauntlet before streaming 7-bit ASCII telemetry into the cns00 pane.
 */

import fs from 'node:fs'
import path from 'node:path'
import {
    RuleSchema,
    AuthorizerSchema,
} from '../../03.laws.unit/fce/rule.schema.js'
import type { Rule, Authorizer } from '../../03.laws.unit/fce/rule.schema.js'
import { PardonRecordSchema } from '../../03.laws.unit/fce/pardon.schema.js'
import type { PardonRecord } from '../../03.laws.unit/fce/pardon.schema.js'
import { validatePass2Pardons } from '../../03.laws.unit/buz/pardon.buzz.js'
import {
    CANONICAL_RULES,
    CANONICAL_AUTHORIZERS,
} from '../../43.compile.unit/buz/compile.buzz.js'

export const REGISTRY_MENU_LABEL = '[ 3. CONSTITUTIONAL RULE REGISTRY ]'

export const REGISTRY_AUDIT_HEADER =
    '--- [299.LORE :: 03.LAWS.UNIT :: CONSTITUTIONAL RULE REGISTRY AUDIT] ---'

export const REGISTRY_SEALED_FOOTER =
    '--- [AUDIT COMPLETE: CONSTITUTIONAL INVARIANTS SEALED AT T0 = $0.00] ---'

export const REGISTRY_BREACHED_FOOTER =
    '--- [AUDIT HALTED: CONSTITUTIONAL INVARIANTS BREACHED AT T0 = $0.00] ---'

export interface PardonLedger {
    seriesSlug: string
    rules: Map<string, Rule>
    authorizers: Map<string, Authorizer>
    pardons: Map<string, PardonRecord>
    characters: Record<string, { id: string }>
    corruptedFiles: string[]
}

export interface PardonLedgerAudit {
    auditedActive: number
    errors: string[]
    warnings: string[]
}

function findSeriesBaseDir(): string | null {
    let curr = process.cwd()
    while (curr && curr !== path.dirname(curr)) {
        const candidate = path.join(curr, 'series')
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
            return candidate
        }
        curr = path.dirname(curr)
    }
    return null
}

function listSeriesSlugs(baseDir: string): string[] {
    return fs
        .readdirSync(baseDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort((a, b) =>
            a === 'under-the-floorboards'
                ? -1
                : b === 'under-the-floorboards'
                  ? 1
                  : a.localeCompare(b),
        )
}

/**
 * Sweeps every series under the discovered corpus: gathers the canonical
 * rule and authorizer registries, validates every pardon JSON dossier with
 * the strict PardonRecordSchema, and collects trainable character ids.
 */
export function discoverPardonLedgers(): PardonLedger {
    const rules = new Map<string, Rule>()
    for (const rule of CANONICAL_RULES) {
        const parsed = RuleSchema.parse(rule)
        rules.set(parsed.id, parsed)
    }

    const authorizers = new Map<string, Authorizer>()
    for (const authorizer of CANONICAL_AUTHORIZERS) {
        const parsed = AuthorizerSchema.parse(authorizer)
        authorizers.set(parsed.id, parsed)
    }

    const pardons = new Map<string, PardonRecord>()
    const characters: Record<string, { id: string }> = {}
    const corruptedFiles: string[] = []

    const baseDir = findSeriesBaseDir()
    if (baseDir) {
        for (const slug of listSeriesSlugs(baseDir)) {
            const charDir = path.join(baseDir, slug, 'characters')
            if (fs.existsSync(charDir)) {
                for (const f of fs.readdirSync(charDir)) {
                    if (f.startsWith('char_') && f.endsWith('.md')) {
                        const id = `char_${f
                            .slice('char_'.length)
                            .replace(/\.md$/, '')}`
                        characters[id] = { id }
                    }
                }
            }

            const pardonsDir = path.join(baseDir, slug, 'pardons')
            if (fs.existsSync(pardonsDir)) {
                for (const f of fs
                    .readdirSync(pardonsDir)
                    .filter((p) => p.endsWith('.json'))) {
                    try {
                        const parsed = PardonRecordSchema.parse(
                            JSON.parse(
                                fs.readFileSync(
                                    path.join(pardonsDir, f),
                                    'utf8',
                                ),
                            ),
                        )
                        pardons.set(parsed.id, parsed)
                    } catch {
                        corruptedFiles.push(`${slug}/pardons/${f}`)
                    }
                }
            }
        }
    }

    return {
        seriesSlug: baseDir ? 'series' : 'headless',
        rules,
        authorizers,
        pardons,
        characters,
        corruptedFiles,
    }
}

/**
 * Runs the real Pass 2 waiver gauntlet over a discovered ledger and returns
 * the audited active waiver count plus fails-closed fatal errors and warnings.
 */
export function auditPardonLedger(ledger: PardonLedger): PardonLedgerAudit {
    const errors: string[] = []
    const warnings: string[] = []

    for (const corrupt of ledger.corruptedFiles) {
        errors.push(`[PARSE_ERROR] Corrupted pardon JSON: ${corrupt}`)
    }

    const currentCanonHash = 'a'.repeat(64)
    const res = validatePass2Pardons(
        ledger.pardons,
        ledger.rules,
        ledger.authorizers,
        { characters: ledger.characters },
        currentCanonHash,
    )

    errors.push(...res.errors)
    warnings.push(...res.warnings)

    return {
        auditedActive: ledger.pardons.size,
        errors,
        warnings,
    }
}

/**
 * Streams the full constitutional registry audit as pure 7-bit ASCII lines
 * for the cns00 Blessed console pane.
 */
export const runConstitutionalRegistryAudit = async (): Promise<string[]> => {
    const lines: string[] = []
    lines.push(REGISTRY_AUDIT_HEADER)

    for (const rule of CANONICAL_RULES) {
        const parsed = RuleSchema.parse(rule)
        lines.push(
            `>> [RULE:LOADED] ${parsed.id} (${parsed.category}) | pardonable: ${parsed.pardonable}`,
        )
    }

    for (const authorizer of CANONICAL_AUTHORIZERS) {
        const parsed = AuthorizerSchema.parse(authorizer)
        lines.push(
            `>> [AUTHORIZER:LOADED] ${parsed.id} (${parsed.role}) | waivable: ${parsed.permitted_severity_classes.join(', ')}`,
        )
    }

    const ledger = discoverPardonLedgers()
    const audit = auditPardonLedger(ledger)
    lines.push(
        `>> [PARDON:AUDITED] Active waivers evaluated: ${audit.errors.length} fatal breaches.`,
    )

    if (audit.errors.length > 0) {
        for (const err of audit.errors) {
            lines.push(`:: [PARDON:FATAL] ${err}`)
        }
        for (const warn of audit.warnings) {
            lines.push(`>> [PARDON:WARNING] ${warn}`)
        }
        lines.push(REGISTRY_BREACHED_FOOTER)
        return lines
    }

    for (const warn of audit.warnings) {
        lines.push(`>> [PARDON:WARNING] ${warn}`)
    }
    lines.push(REGISTRY_SEALED_FOOTER)
    return lines
}
