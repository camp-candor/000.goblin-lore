import * as crypto from 'node:crypto'

export type CanonicalEntityDomain =
    'character' | 'location' | 'possession' | 'grievance'

export interface PinnedEntityDomainRule {
    domain: CanonicalEntityDomain
    id_pattern: string
    required_keys: string[]
    allowed_keys: string[]
    integer_bps_keys: string[]
}

export interface PinnedEdgeSchemaBundle {
    schema_version: string
    trunk_commit_sha: string
    schema_bundle_hash: string
    domains: Record<CanonicalEntityDomain, PinnedEntityDomainRule>
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

export function exportPinnedEdgeSchemaBundle(
    trunkCommitSha: string,
    schemaVersion: string = '1.0.0',
): PinnedEdgeSchemaBundle {
    const domains: Record<CanonicalEntityDomain, PinnedEntityDomainRule> = {
        character: {
            domain: 'character',
            id_pattern: '^char_[a-z0-9_]+$',
            required_keys: ['id', 'name', 'status'],
            allowed_keys: [
                'id',
                'name',
                'type',
                'status',
                'worn',
                'held',
                'carried',
                'cached',
                'somatic',
                'epistemic',
                'banned_kinetic_verbs',
                'available_arms_bps',
            ],
            integer_bps_keys: ['available_arms_bps'],
        },
        location: {
            domain: 'location',
            id_pattern: '^loc_[a-z0-9_]+$',
            required_keys: ['id', 'title'],
            allowed_keys: [
                'id',
                'title',
                'type',
                'acoustic_damping_cdb',
                'lighting_profile',
                'portal_links',
                'dynamic_occluders',
            ],
            integer_bps_keys: ['acoustic_damping_cdb'],
        },
        possession: {
            domain: 'possession',
            id_pattern: '^item_[a-z0-9_]+$',
            required_keys: ['id', 'occupies_hands_bps', 'mass_grams'],
            allowed_keys: [
                'id',
                'name',
                'owner_id',
                'location_id',
                'occupies_hands',
                'occupies_hands_bps',
                'mass_grams',
                'weight_class',
                'is_contested',
                'allowed_slots',
            ],
            integer_bps_keys: ['occupies_hands_bps', 'mass_grams'],
        },
        grievance: {
            domain: 'grievance',
            id_pattern: '^grv_[a-z0-9_]+$',
            required_keys: ['id', 'status', 'participants_primary'],
            allowed_keys: [
                'id',
                'title',
                'status',
                'participants_primary',
                'intensity_bps',
                'cooldown_cycles',
                'spawns_on_max_escalation',
            ],
            integer_bps_keys: ['intensity_bps'],
        },
    }

    const preHashPayload = {
        schema_version: schemaVersion,
        trunk_commit_sha: trunkCommitSha,
        domains,
    }
    const schema_bundle_hash = crypto
        .createHash('sha256')
        .update(canonicalJson(preHashPayload), 'utf8')
        .digest('hex')

    return {
        ...preHashPayload,
        schema_bundle_hash,
    }
}
