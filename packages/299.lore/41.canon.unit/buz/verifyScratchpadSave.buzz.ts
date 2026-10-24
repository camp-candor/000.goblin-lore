import * as fs from 'node:fs'
import matter from 'gray-matter'
import { verifyByteZeroIntegrity } from './byteZero.buzz.js'
import { PossessionDossierFrontmatterSchema } from '../../12.gear.unit/val/gear.val.js'
import type { EntityDomain } from '../../09.entity.unit/fce/humanGate.bit.js'

export interface ScratchpadVerificationResult {
    readonly passed: boolean
    readonly error?: string
    readonly parsedData?: Record<string, any>
}

export const verifyScratchpadSave = (
    tmpFilePath: string,
    domain: EntityDomain,
): ScratchpadVerificationResult => {
    if (!fs.existsSync(tmpFilePath)) {
        return { passed: false, error: `SCRATCHPAD_NOT_FOUND: ${tmpFilePath}` }
    }

    const rawBytes = fs.readFileSync(tmpFilePath)

    // 1. Byte-0 Opening Invariant
    const bz: any = verifyByteZeroIntegrity(rawBytes)
    const isValidByteZero =
        typeof bz === 'boolean' ? bz : Boolean(bz?.valid ?? bz?.isValid)
    if (!isValidByteZero) {
        return {
            passed: false,
            error: 'BYTE_ZERO_BREACH: File does not open with delimiter --- at physical byte offset 0.',
        }
    }

    // 2. Parse Frontmatter
    const content = rawBytes.toString('utf-8')
    let parsed: matter.GrayMatterFile<string>
    try {
        parsed = matter(content)
    } catch (err: any) {
        return {
            passed: false,
            error: `YAML_SYNTAX_ERROR: ${err?.message || String(err)}`,
        }
    }

    const data = parsed.data
    if (!data || typeof data !== 'object' || !data.id) {
        return {
            passed: false,
            error: 'SCHEMA_ERROR: Missing required entity identifier property: id',
        }
    }

    // 3. Domain-Specific Schema & SAT Invariant Gates
    if (domain === 'possessions') {
        const gearResult = PossessionDossierFrontmatterSchema.safeParse(data)
        if (!gearResult.success) {
            const issueDetails = gearResult.error.issues
                .map((i) => `${i.path.join('.')}: ${i.message}`)
                .join('; ')
            return {
                passed: false,
                error: `POSSESSION_SCHEMA_FAIL: ${issueDetails}`,
            }
        }
    }

    if (domain === 'characters') {
        const armsBps = data?.somatic?.available_arms_bps
        if (
            armsBps !== undefined &&
            (typeof armsBps !== 'number' ||
                armsBps < 0 ||
                armsBps > 20000 ||
                !Number.isInteger(armsBps))
        ) {
            return {
                passed: false,
                error: 'SOMATIC_SAT_FAIL: available_arms_bps must be an integer basis point between 0 and 20000.',
            }
        }
    }

    return {
        passed: true,
        parsedData: data,
    }
}
