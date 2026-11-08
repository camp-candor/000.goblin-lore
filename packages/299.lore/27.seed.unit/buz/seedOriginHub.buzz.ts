import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import type { CreatedSeedDossier } from '../fce/seed.bit.js'
import { verifyByteZeroBuffer } from './seedWorldDefinitions.buzz.js'

/**
 * Emits series/<slug>/locations/loc_origin_hub.md at Byte 0.
 */
export function seedOriginHub(
    seriesDir: string,
    seriesSlug: string,
): CreatedSeedDossier {
    const locationsDir = path.join(seriesDir, 'locations')
    if (!fs.existsSync(locationsDir)) {
        fs.mkdirSync(locationsDir, { recursive: true })
    }

    const hubPath = path.join(locationsDir, 'loc_origin_hub.md')
    const hubContent = [
        '---',
        'id: "loc_origin_hub"',
        'title: "Origin Convergence Hub"',
        'type: "location"',
        'axial_coordinates:',
        '  q: 0',
        '  r: 0',
        '  s: 0',
        'max_adult_occupants: 2',
        'acoustic_damping_cdb: 1500',
        'lighting: "dim_crevice"',
        'portal_links: []',
        'tags:',
        '  - "hub"',
        '  - "interior"',
        '---',
        '',
        '## Visual Overview',
        'A low-ceilinged convergence chamber framed by damp corrugated plates and iron floor grates.',
        '',
        '## Acoustic Profile',
        'A continuous low-frequency hum dampens vocal propagation through bulkheads.',
        '',
    ].join('\n')

    fs.writeFileSync(hubPath, hubContent, { encoding: 'utf8' })
    const hubBytes = fs.readFileSync(hubPath)

    return {
        id: 'loc_origin_hub',
        domain: 'locations',
        relativePath: `series/${seriesSlug}/locations/loc_origin_hub.md`,
        absolutePath: hubPath,
        byteZeroVerified: verifyByteZeroBuffer(hubBytes),
        contentSha256: crypto
            .createHash('sha256')
            .update(hubBytes)
            .digest('hex'),
    }
}
