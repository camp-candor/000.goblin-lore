import * as fs from 'node:fs'
import * as path from 'node:path'
import matter from 'gray-matter'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { verifyByteZeroIntegrity } from './byteZero.buzz.js'
import { PossessionDossierFrontmatterSchema } from '../../12.gear.unit/val/gear.val.js'
import type { CompiledEntityRegistry } from '../fce/compileGenesis.bit.js'

export interface PassOneResult {
    readonly passed: boolean
    readonly registry: CompiledEntityRegistry
    readonly seriesConfig: any
    readonly totalEntities: number
    readonly error?: string
}

export const executePassOneGenesisShape = (
    seriesSlug: string,
): PassOneResult => {
    const repoRoot = resolveRepoRoot()
    const seriesDir = path.join(repoRoot, 'series', seriesSlug)

    if (!fs.existsSync(seriesDir)) {
        return {
            passed: false,
            registry: {
                characters: {},
                locations: {},
                possessions: {},
                grievances: {},
            },
            seriesConfig: null,
            totalEntities: 0,
            error: `SERIES_DIRECTORY_NOT_FOUND: ${seriesDir}`,
        }
    }

    // Load series.config.json
    const configPath = path.join(seriesDir, 'series.config.json')
    if (!fs.existsSync(configPath)) {
        return {
            passed: false,
            registry: {
                characters: {},
                locations: {},
                possessions: {},
                grievances: {},
            },
            seriesConfig: null,
            totalEntities: 0,
            error: `SERIES_CONFIG_NOT_FOUND: ${configPath}`,
        }
    }

    const seriesConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

    const registry: CompiledEntityRegistry = {
        characters: {},
        locations: {},
        possessions: {},
        grievances: {},
    }

    const domains: Array<keyof CompiledEntityRegistry> = [
        'characters',
        'locations',
        'possessions',
        'grievances',
    ]

    for (const domain of domains) {
        const domainDir = path.join(seriesDir, domain)
        if (!fs.existsSync(domainDir)) {
            return {
                passed: false,
                registry,
                seriesConfig,
                totalEntities: 0,
                error: `DOMAIN_DIRECTORY_NOT_FOUND: ${domainDir}`,
            }
        }

        const files = fs.readdirSync(domainDir).filter((f) => f.endsWith('.md'))
        for (const file of files) {
            const fullPath = path.join(domainDir, file)
            const rawBytes = fs.readFileSync(fullPath)

            const check = verifyByteZeroIntegrity(rawBytes)
            const isValidByteZero =
                typeof check === 'boolean'
                    ? check
                    : Boolean((check as any).valid ?? (check as any).isValid)
            if (!isValidByteZero) {
                return {
                    passed: false,
                    registry,
                    seriesConfig,
                    totalEntities: 0,
                    error: `BYTE_ZERO_OFFSET_BREACH: ${fullPath} does not open with '---' at byte 0`,
                }
            }

            const fileContent = rawBytes.toString('utf-8')
            const parsed = matter(fileContent)
            const data = parsed.data

            if (!data || typeof data !== 'object' || !data.id) {
                return {
                    passed: false,
                    registry,
                    seriesConfig,
                    totalEntities: 0,
                    error: `MISSING_ENTITY_ID: ${fullPath}`,
                }
            }

            if (domain === 'possessions') {
                const gearParse =
                    PossessionDossierFrontmatterSchema.safeParse(data)
                if (!gearParse.success) {
                    return {
                        passed: false,
                        registry,
                        seriesConfig,
                        totalEntities: 0,
                        error: `GEAR_FRONTMATTER_SCHEMA_FAIL: ${fullPath} - ${gearParse.error.message}`,
                    }
                }
            }

            ;(registry[domain] as Record<string, any>)[data.id] = {
                ...data,
                _source_path: `series/${seriesSlug}/${domain}/${file}`,
            }
        }
    }

    const totalEntities =
        Object.keys(registry.characters).length +
        Object.keys(registry.locations).length +
        Object.keys(registry.possessions).length +
        Object.keys(registry.grievances).length

    return {
        passed: true,
        registry,
        seriesConfig,
        totalEntities,
    }
}
