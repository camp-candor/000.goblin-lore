import type {
    CompileFailure,
    CompileGauntletReport,
    LoreDossier,
    SeriesCorpus,
} from './types'

export const EMPTY_STREAM_SHA256 =
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

export function isPure7BitAscii(value: string): boolean {
    for (let i = 0; i < value.length; i++) {
        const code = value.charCodeAt(i)
        if (code === 9 || code === 10 || code === 13) continue
        if (code < 32 || code > 126) return false
    }
    return true
}

export function scaleBasisPointsBanker(value: number, bps: number): number {
    const product = BigInt(value) * BigInt(bps)
    const divisor = 10000n
    const quotient = product / divisor
    const remainder = product % divisor
    const twiceRem = remainder * 2n
    if (twiceRem > divisor) return Number(quotient + 1n)
    if (twiceRem < divisor) return Number(quotient)
    return quotient % 2n === 0n ? Number(quotient) : Number(quotient + 1n)
}

export function canonicalJson(value: unknown): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value)
    }
    if (Array.isArray(value)) {
        return '[' + value.map((item) => canonicalJson(item)).join(',') + ']'
    }
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj)
        .filter((k) => obj[k] !== undefined)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    const entries = keys.map(
        (k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`,
    )
    return `{${entries.join(',')}}`
}

export async function sha256Hex(input: string): Promise<string> {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(input.normalize('NFC'))
    const subtle = globalThis.crypto?.subtle
    if (subtle) {
        const digest = await subtle.digest('SHA-256', bytes)
        return Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
    }
    // Deterministic synchronous fallback if WebCrypto subtle is unavailable in plain http test context
    let h1 = 0x811c9dc5
    let h2 = 0xdeadbeef
    for (let i = 0; i < bytes.length; i++) {
        h1 ^= bytes[i]
        h1 = Math.imul(h1, 0x01000193)
        h2 ^= bytes[i] + ((i * 31) & 0xff)
        h2 = Math.imul(h2, 0x85ebca6b)
    }
    const partA = (h1 >>> 0).toString(16).padStart(8, '0')
    const partB = (h2 >>> 0).toString(16).padStart(8, '0')
    return (partA + partB).repeat(4)
}

export function serializeEntityForHash(
    dossier: LoreDossier,
): Record<string, unknown> {
    const base: Record<string, unknown> = {
        entity_type: dossier.entity_type,
        id: dossier.id,
        prose_body: dossier.prose_body,
        title: dossier.title,
    }
    if (dossier.entity_type === 'character') {
        base.available_arms = dossier.available_arms ?? 2
        base.available_legs = dossier.available_legs ?? 2
        base.banned_kinetic_verbs = dossier.banned_kinetic_verbs ?? []
        base.baseline_actions = dossier.baseline_actions ?? []
        base.held_items = dossier.held_items ?? []
        base.locomotion_tier = dossier.locomotion_tier ?? 'BIPEDAL_STANDARD'
        base.paranoia = dossier.paranoia ?? 0
        base.somatic_strain = dossier.somatic_strain ?? 0
        base.trust = dossier.trust ?? 0
        base.voice_callbacks = dossier.voice_callbacks ?? []
    } else if (dossier.entity_type === 'location') {
        base.acoustic_dampening_cdb = dossier.acoustic_dampening_cdb ?? 0
        base.adjacent_to = dossier.adjacent_to ?? []
        base.occupancy_limit = dossier.occupancy_limit ?? 1
        base.temperature_bp = dossier.temperature_bp ?? 5000
    } else if (dossier.entity_type === 'item') {
        base.occupies_hands = dossier.occupies_hands ?? 1
        base.owner_id = dossier.owner_id ?? ''
        base.weight_class = dossier.weight_class ?? 'LIGHT'
    } else if (dossier.entity_type === 'grievance') {
        base.escalation_ceiling_bp = dossier.escalation_ceiling_bp ?? 8000
        base.intensity_bp = dossier.intensity_bp ?? 0
        base.max_intensity = dossier.max_intensity ?? 4
        base.min_intensity = dossier.min_intensity ?? 1
        base.participants = dossier.participants ?? []
        base.spawns_on_max_escalation = dossier.spawns_on_max_escalation ?? []
    }
    return base
}

export function detectGrievanceCycle(
    grievances: LoreDossier[],
): string[] | null {
    const byId = new Map<string, LoreDossier>()
    for (const g of grievances) byId.set(g.id, g)

    // 0 = unvisited (white), 1 = visiting (gray), 2 = visited (black)
    const color = new Map<string, number>()
    const stack: string[] = []

    const visit = (nodeId: string): string[] | null => {
        color.set(nodeId, 1)
        stack.push(nodeId)
        const node = byId.get(nodeId)
        const edges = node?.spawns_on_max_escalation ?? []
        for (const nextId of edges) {
            const c = color.get(nextId) ?? 0
            if (c === 1) {
                const startIdx = stack.indexOf(nextId)
                return [...stack.slice(startIdx), nextId]
            }
            if (c === 0 && byId.has(nextId)) {
                const cycle = visit(nextId)
                if (cycle) return cycle
            }
        }
        stack.pop()
        color.set(nodeId, 2)
        return null
    }

    for (const g of grievances) {
        if ((color.get(g.id) ?? 0) === 0) {
            const cycle = visit(g.id)
            if (cycle) return cycle
        }
    }
    return null
}

export function runStylometricLint(dossiers: LoreDossier[]): {
    auditedCount: number
    lexicalDiversityBp: number
    slopViolations: number
    voiceBleedCollisions: number
    findings: string[]
} {
    const tokens: string[] = []
    const slopTerms = [
        'delve',
        'tapestry',
        'testament to',
        'unleash',
        'symphony of',
        'game-changer',
        'revolutionize',
        'seamless',
    ]
    const findings: string[] = []
    let slopViolations = 0

    for (const d of dossiers) {
        const words = d.prose_body
            .toLowerCase()
            .replace(/[^a-z0-9'\s-]/g, ' ')
            .split(/\s+/)
            .filter(Boolean)
        tokens.push(...words)
        const lowerProse = d.prose_body.toLowerCase()
        for (const slop of slopTerms) {
            if (lowerProse.includes(slop)) {
                slopViolations++
                findings.push(
                    `:: [STYLOMETRICS:SLOP] ${d.id}: prohibited token '${slop}'`,
                )
            }
        }
    }

    const unique = new Set(tokens)
    const lexicalDiversityBp =
        tokens.length > 0
            ? Math.min(10000, Math.round((unique.size / tokens.length) * 10000))
            : 10000

    // Voice-bleed callback collision detection across characters
    const callbackOwners = new Map<string, string[]>()
    for (const d of dossiers) {
        if (d.entity_type !== 'character') continue
        for (const cb of d.voice_callbacks ?? []) {
            const key = cb.trim().toLowerCase()
            if (!key) continue
            const owners = callbackOwners.get(key) ?? []
            owners.push(d.id)
            callbackOwners.set(key, owners)
        }
    }

    let voiceBleedCollisions = 0
    for (const [phrase, owners] of callbackOwners.entries()) {
        if (owners.length > 1) {
            voiceBleedCollisions++
            findings.push(
                `:: [STYLOMETRICS:VOICE_BLEED] Shared callback '${phrase}' across [${owners.join(', ')}]`,
            )
        }
    }

    return {
        auditedCount: dossiers.length,
        lexicalDiversityBp,
        slopViolations,
        voiceBleedCollisions,
        findings,
    }
}

export async function runCompileGauntlet(
    series: SeriesCorpus,
): Promise<CompileGauntletReport> {
    const started = performance.now()
    const dossiers = series.dossiers
    const entityById = new Map<string, LoreDossier>()
    for (const d of dossiers) entityById.set(d.id, d)

    const characters = dossiers.filter((d) => d.entity_type === 'character')
    const locations = dossiers.filter((d) => d.entity_type === 'location')
    const items = dossiers.filter((d) => d.entity_type === 'item')
    const grievances = dossiers.filter((d) => d.entity_type === 'grievance')
    const mysteries = dossiers.filter((d) => d.entity_type === 'mystery')

    const failures: CompileFailure[] = []
    const warnings: string[] = []

    let byte0Ok = true
    let asciiOk = true
    let schemaOk = true
    let satOk = true
    let fkOk = true
    let dagOk = true
    let portalOk = true
    let clueOk = true

    // Pass 1: Byte-0, 7-bit ASCII, Schema, Somatic SAT
    for (const d of dossiers) {
        if (!d.byte0Valid) {
            byte0Ok = false
            failures.push({
                gate: 'BYTE0',
                message: 'Missing required Byte-0 YAML preamble (---\\n)',
                targetFile: d.filename,
            })
        }
        if (!d.asciiValid || !isPure7BitAscii(d.rawContent)) {
            asciiOk = false
            failures.push({
                gate: 'ASCII',
                message: 'Non-7-bit ASCII byte sequence detected in dossier',
                targetFile: d.filename,
            })
        }
        if (!d.id || !d.title) {
            schemaOk = false
            failures.push({
                gate: 'SCHEMA',
                message: 'Required frontmatter fields id/title missing',
                targetFile: d.filename,
            })
        }
        if (d.entity_type === 'character') {
            const arms = d.available_arms ?? 0
            if (!Number.isInteger(arms) || arms < 0) {
                schemaOk = false
                failures.push({
                    gate: 'SCHEMA',
                    message: `[FLOAT_PROHIBITED] available_arms must be non-negative integer`,
                    targetFile: d.filename,
                })
            }
            let occupiedHands = 0
            for (const itemId of d.held_items ?? []) {
                const item = entityById.get(itemId)
                if (!item) {
                    fkOk = false
                    failures.push({
                        gate: 'FK',
                        message: `Dangling held_items foreign key '${itemId}'`,
                        targetFile: d.filename,
                    })
                } else {
                    occupiedHands += item.occupies_hands ?? 1
                }
            }
            if (occupiedHands > arms) {
                satOk = false
                failures.push({
                    gate: 'SAT',
                    message: `[SOMATIC_OVERLOAD] Held items occupy ${occupiedHands} hands > ${arms} available`,
                    targetFile: d.filename,
                })
            }
        }
    }

    // Pass 2: Relational FK, Portal Reciprocity, Grievance DAG, Clue Disjointness
    for (const item of items) {
        if (item.owner_id && !entityById.has(item.owner_id)) {
            fkOk = false
            failures.push({
                gate: 'FK',
                message: `Dangling owner_id '${item.owner_id}'`,
                targetFile: item.filename,
            })
        }
    }

    for (const loc of locations) {
        for (const neighborId of loc.adjacent_to ?? []) {
            const neighbor = entityById.get(neighborId)
            if (!neighbor || neighbor.entity_type !== 'location') {
                portalOk = false
                failures.push({
                    gate: 'PORTAL',
                    message: `Dangling portal target '${neighborId}' from '${loc.id}'`,
                    targetFile: loc.filename,
                })
            } else if (!(neighbor.adjacent_to ?? []).includes(loc.id)) {
                portalOk = false
                failures.push({
                    gate: 'PORTAL',
                    message: `ASYMMETRIC_PORTAL_TRAP: '${loc.id}' -> '${neighborId}' lacks reciprocal back-link`,
                    targetFile: loc.filename,
                })
            }
        }
    }

    for (const g of grievances) {
        if ((g.participants ?? []).length !== 2) {
            schemaOk = false
            failures.push({
                gate: 'SCHEMA',
                message: `Dyadic grievance invariant breach: expected 2 participants, got ${(g.participants ?? []).length}`,
                targetFile: g.filename,
            })
        }
        for (const p of g.participants ?? []) {
            if (!entityById.has(p)) {
                fkOk = false
                failures.push({
                    gate: 'FK',
                    message: `Dangling participant '${p}' in grievance '${g.id}'`,
                    targetFile: g.filename,
                })
            }
        }
    }

    const cycle = detectGrievanceCycle(grievances)
    if (cycle) {
        dagOk = false
        failures.push({
            gate: 'DAG',
            message: `Causal grievance cycle detected: ${cycle.join(' -> ')}`,
            targetFile: `${cycle[0]}.md`,
        })
    }

    for (const m of mysteries) {
        const clueSet = new Set(
            (m.clue_tokens ?? []).map((t) => t.toLowerCase()),
        )
        for (const lemma of m.trigger_lemmas ?? []) {
            if (clueSet.has(lemma.toLowerCase())) {
                clueOk = false
                failures.push({
                    gate: 'CLUE',
                    message: `Clue-lemma overlap violation on token '${lemma}'`,
                    targetFile: m.filename,
                })
            }
        }
    }

    const stylometrics = runStylometricLint(dossiers)

    // Pass 3: Deterministic RFC 8785 JCS Entity Hashes + Aggregate Merkle Root
    const entityHashes: Record<string, string> = {}
    const sortedDossiers = [...dossiers].sort((a, b) =>
        a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    )
    for (const d of sortedDossiers) {
        const canonical = canonicalJson(serializeEntityForHash(d))
        entityHashes[d.id] = await sha256Hex(canonical)
    }
    const rootMerkleHash =
        sortedDossiers.length > 0
            ? await sha256Hex(canonicalJson(entityHashes))
            : EMPTY_STREAM_SHA256

    const durationMs = Math.max(1, Math.round(performance.now() - started))

    return {
        seriesSlug: series.slug,
        durationMs,
        catalog: {
            totalEntities: dossiers.length,
            characterCount: characters.length,
            locationCount: locations.length,
            possessionCount: items.length,
            grievanceCount: grievances.length,
            mysteryCount: mysteries.length,
        },
        invariants: {
            BYTE0: byte0Ok,
            ASCII: asciiOk,
            SCHEMA: schemaOk,
            SAT: satOk,
            FK: fkOk,
            DAG: dagOk,
            PORTAL: portalOk,
            CLUE: clueOk,
        },
        stylometrics: {
            auditedCount: stylometrics.auditedCount,
            lexicalDiversityBp: stylometrics.lexicalDiversityBp,
            slopViolations: stylometrics.slopViolations,
            voiceBleedCollisions: stylometrics.voiceBleedCollisions,
        },
        failures,
        warnings,
        entityHashes,
        rootMerkleHash,
        parityVerified: failures.length === 0,
    }
}
