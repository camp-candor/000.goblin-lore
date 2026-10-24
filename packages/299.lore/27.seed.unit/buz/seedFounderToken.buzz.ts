import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import matter from 'gray-matter'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { verifyByteZeroIntegrity } from '../../41.canon.unit/buz/byteZero.buzz.js'
import { PossessionDossierFrontmatterSchema } from '../../12.gear.unit/val/gear.val.js'
import type { CreatedSeedDossierBit } from '../fce/seedGenesisCorpus.bit.js'

export const seedFounderToken = async (
    seriesSlug: string,
): Promise<CreatedSeedDossierBit> => {
    const repoRoot = resolveRepoRoot()
    const filePath = path.join(
        repoRoot,
        'series',
        seriesSlug,
        'possessions',
        'item_founder_token.md',
    )

    const content = [
        '---',
        'id: "item_founder_token"',
        'name: "Founder Token"',
        'mass_grams: 35',
        'weight_class: "scrap"',
        'slot_category: "held"',
        'hands_required_bps: 10000',
        'custody_holder: "char_protagonist"',
        'material: "stamped_brass"',
        'tags:',
        '  - "token"',
        '  - "prop"',
        '---',
        '',
        '## Physical Description',
        'A stamped brass marker worn smooth along the edges with notched rim tallies.',
        '',
        '## Tactical Invariants',
        'Occupies one functional hand slot when gripped directly.',
        '',
    ].join('\n')

    fs.writeFileSync(filePath, content, { encoding: 'utf-8' })

    const rawBytes = fs.readFileSync(filePath)
    const check = verifyByteZeroIntegrity(rawBytes)
    const byteZeroVerified =
        typeof check === 'boolean'
            ? check
            : Boolean((check as any).valid ?? (check as any).isValid)
    const parsed = matter(content)
    PossessionDossierFrontmatterSchema.parse(parsed.data)

    const contentSha256 = crypto
        .createHash('sha256')
        .update(rawBytes)
        .digest('hex')

    return {
        id: 'item_founder_token',
        domain: 'possessions',
        relativePath: `series/${seriesSlug}/possessions/item_founder_token.md`,
        absolutePath: filePath,
        byteZeroVerified,
        contentSha256,
    }
}
