import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import type {
    BibleClientOptions,
    BibleStateEnvelope,
    SpatialPortalEdge,
    StaticSpatialGraph,
} from '../fce/port.interface.js'

const HEX64_PATTERN = /^[0-9a-f]{64}$/

export function jcsSerialize(
    value: unknown,
    nfcNormalize: boolean = true,
): string {
    if (
        value === null ||
        typeof value === 'boolean' ||
        typeof value === 'number'
    ) {
        if (typeof value === 'number' && !Number.isFinite(value)) {
            return 'null'
        }
        return JSON.stringify(value)
    }

    if (typeof value === 'string') {
        const normalized = nfcNormalize ? value.normalize('NFC') : value
        return JSON.stringify(normalized)
    }

    if (Array.isArray(value)) {
        const items = value.map((item) =>
            item === undefined ? 'null' : jcsSerialize(item, nfcNormalize),
        )
        return `[${items.join(',')}]`
    }

    if (typeof value === 'object') {
        const record = value as Record<string, unknown>
        const keys = Object.keys(record)
            .filter((k) => record[k] !== undefined)
            .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

        const pairs = keys.map((k) => {
            const normKey = nfcNormalize ? k.normalize('NFC') : k
            return `${JSON.stringify(normKey)}:${jcsSerialize(record[k], nfcNormalize)}`
        })
        return `{${pairs.join(',')}}`
    }

    return 'null'
}

export function deepFreeze<T>(obj: T): Readonly<T> {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }

    if (Array.isArray(obj)) {
        for (const item of obj) {
            deepFreeze(item)
        }
    } else {
        for (const key of Object.keys(obj)) {
            deepFreeze((obj as Record<string, unknown>)[key])
        }
    }

    return Object.freeze(obj)
}

export function computePreSealMerkleHash(
    envelope: Omit<BibleStateEnvelope, 'root_merkle_hash' | 'compiled_at'>,
): string {
    const preSealPayload = {
        schema_version: envelope.schema_version,
        series_slug: envelope.series_slug,
        catalog_summary: envelope.catalog_summary,
        entity_hashes: envelope.entity_hashes,
        entities: envelope.entities,
    }
    const canonicalBytes = jcsSerialize(preSealPayload, true)
    return crypto
        .createHash('sha256')
        .update(canonicalBytes, 'utf8')
        .digest('hex')
}

export function loadBibleState(
    seriesSlug: string,
    options?: BibleClientOptions,
): Readonly<BibleStateEnvelope> {
    if (
        !seriesSlug ||
        typeof seriesSlug !== 'string' ||
        seriesSlug.trim().length === 0
    ) {
        throw new Error(
            '[INVALID_SERIES_SLUG] seriesSlug must be a non-empty string',
        )
    }

    const repoRoot = options?.repoRoot || resolveRepoRoot()
    const biblePath = path.join(
        repoRoot,
        'compiled',
        seriesSlug,
        'bible-state.json',
    )

    if (!fs.existsSync(biblePath)) {
        throw new Error(
            `[BIBLE_STATE_NOT_FOUND] Compiled artifact missing at '${biblePath}'`,
        )
    }

    let parsed: BibleStateEnvelope
    try {
        const raw = fs.readFileSync(biblePath, 'utf8')
        parsed = JSON.parse(raw) as BibleStateEnvelope
    } catch (err: any) {
        throw new Error(
            `[CANON_TAMPER_DETECTED] Malformed JSON in '${biblePath}': ${err.message}`,
        )
    }

    if (
        !parsed ||
        typeof parsed.root_merkle_hash !== 'string' ||
        !HEX64_PATTERN.test(parsed.root_merkle_hash)
    ) {
        throw new Error(
            `[CANON_TAMPER_DETECTED] Invalid or missing root_merkle_hash in '${biblePath}'`,
        )
    }

    const computedHash = computePreSealMerkleHash({
        schema_version: parsed.schema_version,
        series_slug: parsed.series_slug,
        catalog_summary: parsed.catalog_summary,
        entity_hashes: parsed.entity_hashes,
        entities: parsed.entities,
    })

    if (computedHash !== parsed.root_merkle_hash) {
        throw new Error(
            `[CANON_TAMPER_DETECTED] Merkle root mismatch for '${seriesSlug}': expected ${parsed.root_merkle_hash}, computed ${computedHash}`,
        )
    }

    return deepFreeze(parsed)
}

export function getStaticSpatialGraph(
    seriesSlug: string,
    options?: BibleClientOptions,
): Readonly<StaticSpatialGraph> {
    const state = loadBibleState(seriesSlug, options)
    const locations: Record<string, any> = {}
    const edges: SpatialPortalEdge[] = []

    const rawLocations =
        state.entities?.locations &&
        typeof state.entities.locations === 'object'
            ? state.entities.locations
            : Object.fromEntries(
                  Object.entries(state.entities || {}).filter(([key]) =>
                      key.startsWith('loc_'),
                  ),
              )

    const sortedLocIds = Object.keys(rawLocations).sort((a, b) =>
        a < b ? -1 : a > b ? 1 : 0,
    )

    for (const locId of sortedLocIds) {
        const locData = rawLocations[locId]
        locations[locId] = locData
        const portals = Array.isArray(locData?.portal_links)
            ? locData.portal_links
            : []
        for (const p of portals) {
            if (p && typeof p.target_location_id === 'string') {
                edges.push({
                    source_location_id: locId,
                    target_location_id: p.target_location_id,
                    portal_slug: String(
                        p.portal_slug ||
                            `portal_${locId}_to_${p.target_location_id}`,
                    ),
                    damping_cdb:
                        typeof p.damping_cdb === 'number'
                            ? p.damping_cdb
                            : 1500,
                    line_of_sight: Boolean(p.line_of_sight),
                })
            }
        }
    }

    return deepFreeze({
        series_slug: state.series_slug,
        root_merkle_hash: state.root_merkle_hash,
        locations,
        edges,
    })
}
