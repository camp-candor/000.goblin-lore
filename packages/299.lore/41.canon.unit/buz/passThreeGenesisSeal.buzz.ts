import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import type {
    CanonicalBibleState,
    CompiledEntityRegistry,
} from '../fce/compileGenesis.bit.js'

export interface PassThreeResult {
    readonly passed: boolean
    readonly merkleRoot: string
    readonly canonicalHeadPath: string
    readonly compiledState: CanonicalBibleState
    readonly error?: string
}

export const canonicalizeJson = (obj: any): string => {
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string') {
            return JSON.stringify(obj.normalize('NFC'))
        }
        if (typeof obj === 'number') {
            if (!Number.isFinite(obj)) {
                throw new TypeError(
                    'Non-finite numbers are not permitted under RFC 8785 JCS',
                )
            }
            return JSON.stringify(obj)
        }
        return JSON.stringify(obj)
    }

    if (Array.isArray(obj)) {
        const elements = obj.map((e) => canonicalizeJson(e))
        return `[${elements.join(',')}]`
    }

    const sortedKeys = Object.keys(obj).sort((a, b) => {
        // UTF-16 code unit lexicographical sort
        return a < b ? -1 : a > b ? 1 : 0
    })

    const parts = sortedKeys.map((key) => {
        const canonicalKey = JSON.stringify(key.normalize('NFC'))
        const canonicalVal = canonicalizeJson(obj[key])
        return `${canonicalKey}:${canonicalVal}`
    })

    return `{${parts.join(',')}}`
}

export const executePassThreeGenesisSeal = (
    seriesSlug: string,
    seriesConfig: any,
    registry: CompiledEntityRegistry,
): PassThreeResult => {
    const repoRoot = resolveRepoRoot()
    const compiledDir = path.join(repoRoot, 'compiled', seriesSlug)

    if (!fs.existsSync(compiledDir)) {
        fs.mkdirSync(compiledDir, { recursive: true })
    }

    const charCount = Object.keys(registry.characters).length
    const locCount = Object.keys(registry.locations).length
    const possCount = Object.keys(registry.possessions).length
    const grvCount = Object.keys(registry.grievances).length
    const totalCount = charCount + locCount + possCount + grvCount

    // Assembly of core payload for state hashing (stripping volatile timestamps from the root payload)
    const statePayload = {
        entities: registry,
        series_config: seriesConfig,
    }

    const canonicalStatePayload = canonicalizeJson(statePayload)
    const stateHash = crypto
        .createHash('sha256')
        .update(canonicalStatePayload, 'utf-8')
        .digest('hex')

    const compiledState: CanonicalBibleState = {
        _meta: {
            schema_version: '1.0.0',
            series_slug: seriesSlug,
            compiled_at_utc: new Date().toISOString(),
            entity_counts: {
                characters: charCount,
                locations: locCount,
                possessions: possCount,
                grievances: grvCount,
                total: totalCount,
            },
            state_hash: stateHash,
        },
        series_config: seriesConfig,
        entities: registry,
    }

    const canonicalJsonOutput = JSON.stringify(compiledState, null, 2) + '\n'
    const canonicalHeadPath = path.join(compiledDir, 'bible-state.json')
    const tempPath = path.join(
        compiledDir,
        `.tmp_bible-state.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.json`,
    )

    try {
        fs.writeFileSync(tempPath, canonicalJsonOutput, { encoding: 'utf-8' })
        fs.renameSync(tempPath, canonicalHeadPath)

        return {
            passed: true,
            merkleRoot: stateHash,
            canonicalHeadPath,
            compiledState,
        }
    } catch (err: any) {
        if (fs.existsSync(tempPath)) {
            try {
                fs.unlinkSync(tempPath)
            } catch {}
        }
        return {
            passed: false,
            merkleRoot: '',
            canonicalHeadPath: '',
            compiledState,
            error: `ATOMIC_SWAP_FAILURE: ${err?.message || String(err)}`,
        }
    }
}
