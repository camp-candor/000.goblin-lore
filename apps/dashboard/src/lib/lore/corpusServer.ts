import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CorpusSnapshot, EntityKind, LoreDossier, SeriesCorpus } from './types'
import { isPure7BitAscii } from './compiler'

function findRepoRoot(startDir: string): string {
    const candidates = [startDir]
    try {
        candidates.push(path.dirname(fileURLToPath(import.meta.url)))
    } catch {
        // Ignore if import.meta.url cannot resolve to file path
    }
    for (const candidate of candidates) {
        let dir = path.resolve(candidate)
        for (let i = 0; i < 8; i++) {
            if (
                fs.existsSync(path.join(dir, 'lore', 'series')) &&
                fs.existsSync(path.join(dir, 'package.json'))
            ) {
                return dir
            }
            const parent = path.dirname(dir)
            if (parent === dir) break
            dir = parent
        }
    }
    return process.cwd()
}

function parseScalar(raw: string): string | number | string[] {
    const trimmed = raw.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const inner = trimmed.slice(1, -1).trim()
        if (!inner) return []
        return inner
            .split(',')
            .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
            .filter(Boolean)
    }
    if (/^-?\d+$/.test(trimmed)) {
        return Number.parseInt(trimmed, 10)
    }
    if (/^-?\d+\.\d+$/.test(trimmed)) {
        return Number.parseFloat(trimmed)
    }
    return trimmed.replace(/^['"]|['"]$/g, '')
}

export function parseDossierMarkdown(filename: string, rawContent: string): LoreDossier | null {
    const normalized = rawContent.replace(/\r\n/g, '\n')
    const byte0Valid = normalized.startsWith('---\n')
    const asciiValid = isPure7BitAscii(rawContent)

    const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
    if (!match) {
        return null
    }

    const yamlBlock = match[1]
    const proseBody = match[2].trim()

    const fields: Record<string, string | number | string[]> = {}
    let activeListKey: string | null = null

    for (const line of yamlBlock.split('\n')) {
        if (!line.trim()) continue
        const listItemMatch = line.match(/^\s+-\s+(.*)$/)
        if (listItemMatch && activeListKey) {
            const existing = fields[activeListKey]
            const item = listItemMatch[1].trim().replace(/^['"]|['"]$/g, '')
            if (Array.isArray(existing)) {
                existing.push(item)
            } else {
                fields[activeListKey] = [item]
            }
            continue
        }

        const kvMatch = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/)
        if (kvMatch) {
            const key = kvMatch[1]
            const val = kvMatch[2]
            if (!val.trim()) {
                fields[key] = []
                activeListKey = key
            } else {
                fields[key] = parseScalar(val)
                activeListKey = null
            }
        }
    }

    const rawKind = String(fields.entity_type || 'character')
    const validKinds: EntityKind[] = ['character', 'location', 'item', 'grievance', 'mystery']
    const entity_type: EntityKind = validKinds.includes(rawKind as EntityKind)
        ? (rawKind as EntityKind)
        : 'character'

    const toStringArray = (v: unknown): string[] => {
        if (Array.isArray(v)) return v.map(String)
        if (typeof v === 'string' && v) return [v]
        return []
    }

    const toNum = (v: unknown): number | undefined =>
        typeof v === 'number' && !Number.isNaN(v) ? v : undefined

    return {
        id: String(fields.id || filename.replace(/\.md$/, '')),
        filename,
        entity_type,
        title: String(fields.title || fields.id || filename),
        byte0Valid,
        asciiValid,
        prose_body: proseBody,
        rawContent,
        available_arms: toNum(fields.available_arms),
        available_legs: toNum(fields.available_legs),
        locomotion_tier:
            typeof fields.locomotion_tier === 'string' ? fields.locomotion_tier : undefined,
        paranoia: toNum(fields.paranoia),
        trust: toNum(fields.trust),
        somatic_strain: toNum(fields.somatic_strain),
        banned_kinetic_verbs: toStringArray(fields.banned_kinetic_verbs),
        baseline_actions: toStringArray(fields.baseline_actions),
        voice_callbacks: toStringArray(fields.voice_callbacks),
        held_items: toStringArray(fields.held_items),
        occupancy_limit: toNum(fields.occupancy_limit),
        temperature_bp: toNum(fields.temperature_bp),
        acoustic_dampening_cdb: toNum(fields.acoustic_dampening_cdb),
        adjacent_to: toStringArray(fields.adjacent_to),
        owner_id: typeof fields.owner_id === 'string' ? fields.owner_id : undefined,
        weight_class: typeof fields.weight_class === 'string' ? fields.weight_class : undefined,
        occupies_hands: toNum(fields.occupies_hands),
        min_intensity: toNum(fields.min_intensity),
        max_intensity: toNum(fields.max_intensity),
        intensity_bp: toNum(fields.intensity_bp),
        escalation_ceiling_bp: toNum(fields.escalation_ceiling_bp),
        participants: toStringArray(fields.participants),
        spawns_on_max_escalation: toStringArray(fields.spawns_on_max_escalation),
    }
}

export function loadCorpusSnapshotFromDisk(): CorpusSnapshot {
    const rootDir = findRepoRoot(process.cwd())
    let appName = 'goblin-lore'
    let appVersion = '0.1.7'
    let libraryVersion = '0.4.3'

    try {
        const rootPkgPath = path.join(rootDir, 'package.json')
        if (fs.existsSync(rootPkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8')) as {
                name?: string
                version?: string
            }
            if (pkg.name) appName = pkg.name
            if (pkg.version) appVersion = pkg.version
        }
    } catch {
        // Retain defaults
    }

    try {
        const libPkgPath = path.join(rootDir, 'apps', '995.library', 'package.json')
        if (fs.existsSync(libPkgPath)) {
            const libPkg = JSON.parse(fs.readFileSync(libPkgPath, 'utf-8')) as {
                version?: string
            }
            if (libPkg.version) libraryVersion = libPkg.version
        }
    } catch {
        // Retain defaults
    }

    const loreSeriesDir = path.join(rootDir, 'lore', 'series')
    const compiledDir = path.join(rootDir, 'compiled')
    const seriesList: SeriesCorpus[] = []

    if (fs.existsSync(loreSeriesDir)) {
        const entries = fs
            .readdirSync(loreSeriesDir, { withFileTypes: true })
            .filter((e) => e.isDirectory())
            .map((e) => e.name)
            .sort()

        for (const slug of entries) {
            const dirPath = path.join(loreSeriesDir, slug)
            const files = fs
                .readdirSync(dirPath)
                .filter((f) => f.endsWith('.md'))
                .sort()

            const dossiers: LoreDossier[] = []
            for (const file of files) {
                const fullPath = path.join(dirPath, file)
                const content = fs.readFileSync(fullPath, 'utf-8')
                const parsed = parseDossierMarkdown(file, content)
                if (parsed) dossiers.push(parsed)
            }

            let compiledRootHash: string | null = null
            let compiledAt: string | null = null
            let compiledEntityCount = 0

            const biblePath = path.join(compiledDir, slug, 'bible-state.json')
            if (fs.existsSync(biblePath)) {
                try {
                    const bible = JSON.parse(fs.readFileSync(biblePath, 'utf-8')) as {
                        root_merkle_hash?: string
                        compiled_at?: string
                        catalog_summary?: { totalEntities?: number }
                    }
                    compiledRootHash = bible.root_merkle_hash ?? null
                    compiledAt = bible.compiled_at ?? null
                    compiledEntityCount = bible.catalog_summary?.totalEntities ?? 0
                } catch {
                    // Ignore malformed snapshot
                }
            }

            seriesList.push({
                slug,
                sourcePath: `lore/series/${slug}`,
                dossiers,
                compiledRootHash,
                compiledAt,
                compiledEntityCount,
            })
        }
    }

    const defaultSeries =
        seriesList.find((s) => s.slug === '000.sample-hearth')?.slug ||
        seriesList[0]?.slug ||
        '000.sample-hearth'

    return {
        appName,
        appVersion,
        libraryVersion,
        defaultSeries,
        seriesList,
    }
}
