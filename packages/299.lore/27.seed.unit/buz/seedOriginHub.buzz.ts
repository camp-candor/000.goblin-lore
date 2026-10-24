import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { verifyByteZeroIntegrity } from '../../41.canon.unit/buz/byteZero.buzz.js'
import type { CreatedSeedDossierBit } from '../fce/seedGenesisCorpus.bit.js'

export const seedOriginHub = async (
    seriesSlug: string,
): Promise<CreatedSeedDossierBit> => {
    const repoRoot = resolveRepoRoot()
    const filePath = path.join(
        repoRoot,
        'series',
        seriesSlug,
        'locations',
        'loc_origin_hub.md',
    )

    const content = [
        '---',
        'id: "loc_origin_hub"',
        'title: "Origin Hub"',
        'axial_coords:',
        '  q: 0',
        '  r: 0',
        '  s: 0',
        'max_adult_occupants: 2',
        'acoustic_damping_cdb: 1500',
        'adjacent_locations: []',
        'tags:',
        '  - "hub"',
        '  - "interior"',
        '---',
        '',
        '## Visual Overview',
        'A low-ceilinged convergence room formed by overlapping corrugated bulkheads and damp floor grates.',
        '',
        '## Acoustic Profile',
        'A constant ambient rumble dampens vocal propagation through the partition walls.',
        '',
    ].join('\n')

    fs.writeFileSync(filePath, content, { encoding: 'utf-8' })

    const rawBytes = fs.readFileSync(filePath)
    const check = verifyByteZeroIntegrity(rawBytes)
    const byteZeroVerified =
        typeof check === 'boolean'
            ? check
            : Boolean((check as any).valid ?? (check as any).isValid)
    const contentSha256 = crypto
        .createHash('sha256')
        .update(rawBytes)
        .digest('hex')

    return {
        id: 'loc_origin_hub',
        domain: 'locations',
        relativePath: `series/${seriesSlug}/locations/loc_origin_hub.md`,
        absolutePath: filePath,
        byteZeroVerified,
        contentSha256,
    }
}
