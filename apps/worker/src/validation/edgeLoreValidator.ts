export type EdgeEntityDomain =
    'character' | 'location' | 'possession' | 'grievance'

export interface EdgeEntityDomainRule {
    domain: EdgeEntityDomain
    id_pattern: string
    required_keys: string[]
    allowed_keys: string[]
    integer_bps_keys: string[]
}

export interface PinnedEdgeSchemaBundle {
    schema_version: string
    trunk_commit_sha: string
    schema_bundle_hash: string
    domains: Record<EdgeEntityDomain, EdgeEntityDomainRule>
}

export interface EdgeDraftValidationInput {
    entity_id: string
    domain: EdgeEntityDomain
    schema_bundle_hash: string
    frontmatter: Record<string, unknown>
    raw_markdown: string
}

export interface EdgeDraftValidationReceipt {
    valid: boolean
    entity_id: string
    domain: EdgeEntityDomain
    errorCode?:
        | 'SCHEMA_BUNDLE_SKEW_BREACH'
        | 'BYTE_ZERO_BREACH'
        | 'INVALID_ENTITY_ID'
        | 'UNKNOWN_DOMAIN'
        | 'MISSING_REQUIRED_KEY'
        | 'UNSCHEMAED_KEY_REJECTED'
        | 'FLOAT_PROHIBITED'
        | 'BASIS_POINT_RANGE_BREACH'
    errors: string[]
}

function canonicalJson(value: unknown): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value)
    }
    if (Array.isArray(value)) {
        return `[${value.map((v) => canonicalJson(v)).join(',')}]`
    }
    const rec = value as Record<string, unknown>
    const keys = Object.keys(rec).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(rec[k])}`).join(',')}}`
}

export async function computeEdgeSchemaBundleHash(
    bundle: Omit<PinnedEdgeSchemaBundle, 'schema_bundle_hash'>,
): Promise<string> {
    const payload = {
        schema_version: bundle.schema_version,
        trunk_commit_sha: bundle.trunk_commit_sha,
        domains: bundle.domains,
    }
    const encoded = new TextEncoder().encode(canonicalJson(payload))
    const digest = await crypto.subtle.digest('SHA-256', encoded)
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

export async function verifyPinnedSchemaBundle(
    bundle: PinnedEdgeSchemaBundle,
): Promise<boolean> {
    if (!bundle || typeof bundle.schema_bundle_hash !== 'string') return false
    const recomputed = await computeEdgeSchemaBundleHash(bundle)
    return recomputed === bundle.schema_bundle_hash
}

export function validateEdgeDraftPayload(
    input: EdgeDraftValidationInput,
    pinnedBundle: PinnedEdgeSchemaBundle,
): EdgeDraftValidationReceipt {
    const errors: string[] = []

    if (input.schema_bundle_hash !== pinnedBundle.schema_bundle_hash) {
        return {
            valid: false,
            entity_id: input.entity_id,
            domain: input.domain,
            errorCode: 'SCHEMA_BUNDLE_SKEW_BREACH',
            errors: [
                `[SCHEMA_BUNDLE_SKEW_BREACH] Draft schema hash '${input.schema_bundle_hash}' diverges from pinned trunk bundle '${pinnedBundle.schema_bundle_hash}'`,
            ],
        }
    }

    if (
        !input.raw_markdown.startsWith('---\n') ||
        input.raw_markdown.includes('\r')
    ) {
        return {
            valid: false,
            entity_id: input.entity_id,
            domain: input.domain,
            errorCode: 'BYTE_ZERO_BREACH',
            errors: [
                '[BYTE_ZERO_BREACH] Draft markdown must start with "---\\n" at byte 0 with POSIX LF line endings',
            ],
        }
    }

    const rule = pinnedBundle.domains[input.domain]
    if (!rule) {
        return {
            valid: false,
            entity_id: input.entity_id,
            domain: input.domain,
            errorCode: 'UNKNOWN_DOMAIN',
            errors: [
                `[UNKNOWN_DOMAIN] Domain '${input.domain}' is not registered in pinned schemas.json`,
            ],
        }
    }

    const idRegex = new RegExp(rule.id_pattern)
    if (!idRegex.test(input.entity_id)) {
        return {
            valid: false,
            entity_id: input.entity_id,
            domain: input.domain,
            errorCode: 'INVALID_ENTITY_ID',
            errors: [
                `[INVALID_ENTITY_ID] Entity ID '${input.entity_id}' failed pattern ${rule.id_pattern}`,
            ],
        }
    }

    const fm = input.frontmatter || {}
    const allowedSet = new Set(rule.allowed_keys)

    for (const reqKey of rule.required_keys) {
        if (
            !(reqKey in fm) ||
            fm[reqKey] === undefined ||
            fm[reqKey] === null
        ) {
            errors.push(
                `[MISSING_REQUIRED_KEY] Required key '${reqKey}' missing for ${input.domain}`,
            )
        }
    }

    for (const key of Object.keys(fm)) {
        if (!allowedSet.has(key)) {
            return {
                valid: false,
                entity_id: input.entity_id,
                domain: input.domain,
                errorCode: 'UNSCHEMAED_KEY_REJECTED',
                errors: [
                    `[UNSCHEMAED_KEY_REJECTED] Un-schemaed key '${key}' is forbidden on ${input.domain}`,
                ],
            }
        }
    }

    for (const bpsKey of rule.integer_bps_keys) {
        if (bpsKey in fm && fm[bpsKey] !== undefined && fm[bpsKey] !== null) {
            const val = fm[bpsKey]
            if (typeof val !== 'number' || !Number.isInteger(val)) {
                return {
                    valid: false,
                    entity_id: input.entity_id,
                    domain: input.domain,
                    errorCode: 'FLOAT_PROHIBITED',
                    errors: [
                        `[FLOAT_PROHIBITED] Metric '${bpsKey}' must be an integer, received ${String(val)}`,
                    ],
                }
            }
            if (val < 0 || val > 20000) {
                return {
                    valid: false,
                    entity_id: input.entity_id,
                    domain: input.domain,
                    errorCode: 'BASIS_POINT_RANGE_BREACH',
                    errors: [
                        `[BASIS_POINT_RANGE_BREACH] Metric '${bpsKey}' (${val}) out of 0..20000 bounds`,
                    ],
                }
            }
        }
    }

    if (errors.length > 0) {
        return {
            valid: false,
            entity_id: input.entity_id,
            domain: input.domain,
            errorCode: 'MISSING_REQUIRED_KEY',
            errors,
        }
    }

    return {
        valid: true,
        entity_id: input.entity_id,
        domain: input.domain,
        errors: [],
    }
}
