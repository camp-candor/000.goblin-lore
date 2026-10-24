import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { verifyByteZeroIntegrity } from '../../41.canon.unit/buz/byteZero.buzz.js'
import type { CreatedSeedDossierBit } from '../fce/seedGenesisCorpus.bit.js'

export const seedTerritorialImpasse = async (
    seriesSlug: string,
): Promise<CreatedSeedDossierBit> => {
    const repoRoot = resolveRepoRoot()
    const filePath = path.join(
        repoRoot,
        'series',
        seriesSlug,
        'grievances',
        'grv_territorial_impasse.md',
    )

    const content = [
        '---',
        'id: "grv_territorial_impasse"',
        'title: "Territorial Impasse"',
        'participants_primary:',
        '  - "char_protagonist"',
        'location_anchor: "loc_origin_hub"',
        'physical_anchor_prop: "item_founder_token"',
        'intensity_bounds_bps:',
        '  - 2000',
        '  - 8000',
        'cooldown_ticks: 10',
        'spawns_on_max_escalation: null',
        'tags:',
        '  - "territory"',
        '  - "impasse"',
        '---',
        '',
        '## Surface Argument',
        'Dispute over baseline room allocation rights and possession of the notched brass marker.',
        '',
        '## The Underneath',
        'Unspoken terror that surrendering boundary perimeter control signals total surrender of authority.',
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
        id: 'grv_territorial_impasse',
        domain: 'grievances',
        relativePath: `series/${seriesSlug}/grievances/grv_territorial_impasse.md`,
        absolutePath: filePath,
        byteZeroVerified,
        contentSha256,
    }
}
