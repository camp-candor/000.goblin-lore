import * as fs from 'node:fs'
import * as path from 'node:path'
import matter from 'gray-matter'
import { TargetModel } from '../target.model.js'
import type { EntityGraphNodeBit, TargetDomain } from '../fce/target.bit.js'
import type TargetBit from '../fce/target.bit.js'
import type State from '../../99.core/state.js'

export const initTarget = (cpy: TargetModel, bal: TargetBit, ste: State) => {
    return cpy
}

export const updateTarget = (cpy: TargetModel, bal: TargetBit, ste: State) => {
    return cpy
}

const DOMAIN_SUBDIRS: Array<{ dir: string; domain: TargetDomain }> = [
    { dir: 'characters', domain: 'character' },
    { dir: 'locations', domain: 'location' },
    { dir: 'possessions', domain: 'possession' },
    { dir: 'grievances', domain: 'grievance' },
    { dir: 'world', domain: 'world' },
]

/**
 * Extracts outbound string references from arbitrary frontmatter objects.
 */
function extractReferences(obj: unknown): string[] {
    const refs: string[] = []
    if (!obj || typeof obj !== 'object') return refs

    for (const value of Object.values(obj)) {
        if (typeof value === 'string') {
            if (/^(char|loc|item|grv)_[a-z0-9_]+$/.test(value)) {
                refs.push(value)
            }
        } else if (Array.isArray(value)) {
            for (const item of value) {
                if (
                    typeof item === 'string' &&
                    /^(char|loc|item|grv)_[a-z0-9_]+$/.test(item)
                ) {
                    refs.push(item)
                } else if (typeof item === 'object') {
                    refs.push(...extractReferences(item))
                }
            }
        } else if (typeof value === 'object') {
            refs.push(...extractReferences(value))
        }
    }
    return refs
}

/**
 * Scans markdown files on disk and builds the in-memory multigraph registry.
 */
export function bootstrapGraphRegistryBuzz(seriesPath: string): {
    readonly success: boolean
    readonly totalIndexed: number
    readonly domainCounts: Record<TargetDomain, number>
    readonly message: string
} {
    const model = TargetModel.getInstance()
    model.clear()

    if (!fs.existsSync(seriesPath)) {
        return {
            success: false,
            totalIndexed: 0,
            domainCounts: model.getDomainCounts(),
            message: `[FAIL] :: Path does not exist: ${seriesPath}`,
        }
    }

    let totalIndexed = 0

    for (const { dir, domain } of DOMAIN_SUBDIRS) {
        const fullDirPath = path.join(seriesPath, dir)
        if (!fs.existsSync(fullDirPath)) continue

        const files = fs.readdirSync(fullDirPath)
        for (const file of files) {
            if (!file.endsWith('.md')) continue
            if (file.startsWith('_template') || file.includes('_retired'))
                continue

            const fullFilePath = path.join(fullDirPath, file)
            const stat = fs.statSync(fullFilePath)
            if (!stat.isFile()) continue

            const fileContent = fs.readFileSync(fullFilePath, 'utf8')
            const parsed = matter(fileContent)

            const id = String(parsed.data.id || path.basename(file, '.md'))
            const title = String(parsed.data.name || parsed.data.title || id)
            const references = extractReferences(parsed.data)

            const node: EntityGraphNodeBit = {
                id,
                domain,
                filePath: fullFilePath,
                title,
                references,
                rawFrontmatter: parsed.data,
            }

            model.registerNode(node)
            totalIndexed++
        }
    }

    return {
        success: true,
        totalIndexed,
        domainCounts: model.getDomainCounts(),
        message: `[OK] :: Indexed ${totalIndexed} nodes across corpus`,
    }
}

/**
 * Returns candidate entity IDs matching prefix and query substrings.
 */
export function queryForeignKeyCandidatesBuzz(
    domainPrefix?: string,
    query: string = '',
    limit: number = 20,
): string[] {
    const model = TargetModel.getInstance()
    const allNodes = model.getAllNodes()

    const filtered = allNodes.filter((node) => {
        if (domainPrefix && !node.id.startsWith(domainPrefix)) {
            return false
        }
        if (!query) return true
        const q = query.toLowerCase()
        return (
            node.id.toLowerCase().includes(q) ||
            node.title.toLowerCase().includes(q)
        )
    })

    return filtered
        .map((n) => n.id)
        .sort((a, b) => a.localeCompare(b))
        .slice(0, limit)
}
