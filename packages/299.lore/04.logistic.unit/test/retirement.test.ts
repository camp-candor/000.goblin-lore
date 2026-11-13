import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import yaml from 'js-yaml'
import { retireCanonicalEntity } from '../buz/relocateRetired.buzz.js'

describe('04.logistic.unit :: Atomic Entity Retirement Relocator', () => {
    let tempRepoRoot: string
    const seriesSlug = 'test-retirement-series'

    beforeEach(() => {
        tempRepoRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'goblin-retire-test-'),
        )
        const seriesDir = path.join(tempRepoRoot, 'series', seriesSlug)
        fs.mkdirSync(path.join(seriesDir, 'characters'), { recursive: true })
        fs.mkdirSync(path.join(seriesDir, 'locations'), { recursive: true })
        fs.mkdirSync(path.join(seriesDir, 'possessions'), { recursive: true })
        fs.mkdirSync(path.join(seriesDir, 'grievances'), { recursive: true })

        fs.writeFileSync(
            path.join(seriesDir, 'locations', 'loc_culvert_siphon.md'),
            '---\nid: loc_culvert_siphon\ntitle: Culvert Siphon\n---\n\n## Geometry\nIron pipe.\n',
            'utf8',
        )

        fs.writeFileSync(
            path.join(seriesDir, 'characters', 'char_wart.md'),
            [
                '---',
                'id: char_wart',
                'name: Wart',
                'status: active',
                'worn: []',
                'held: []',
                'carried: []',
                'cached: {}',
                'somatic:',
                '  available_arms_bps: 10000',
                '---',
                '',
                '## Wants (surface)',
                'Keep the grate clear.',
                '',
            ].join('\n'),
            'utf8',
        )

        fs.writeFileSync(
            path.join(seriesDir, 'characters', 'char_old_snag.md'),
            [
                '---',
                'id: char_old_snag',
                'name: Old Snag',
                'status: active',
                'worn: []',
                'held:',
                '  - item_brass_key',
                'carried: []',
                'cached: {}',
                'somatic:',
                '  available_arms_bps: 20000',
                '---',
                '',
                '## Wants (surface)',
                'Guard the lower sluice.',
                '',
            ].join('\n'),
            'utf8',
        )

        fs.writeFileSync(
            path.join(seriesDir, 'possessions', 'item_brass_key.md'),
            [
                '---',
                'id: item_brass_key',
                'owner_id: char_old_snag',
                'location_id: null',
                'occupies_hands: 1',
                'occupies_hands_bps: 10000',
                'mass_grams: 120',
                'weight_class: shine',
                'allowed_slots:',
                '  - HELD_PRIMARY',
                '---',
                '',
                '## Provenance Notes',
                'Heavy brass gate key.',
                '',
            ].join('\n'),
            'utf8',
        )

        fs.writeFileSync(
            path.join(seriesDir, 'grievances', 'grv_sluice_toll.md'),
            [
                '---',
                'id: grv_sluice_toll',
                'status: ACTIVE_ENDORSED',
                'participants_primary:',
                '  - char_old_snag',
                '  - char_wart',
                '---',
                '',
                '## Dispute',
                'Unpaid tallow toll.',
                '',
            ].join('\n'),
            'utf8',
        )
    })

    afterEach(() => {
        if (fs.existsSync(tempRepoRoot)) {
            fs.rmSync(tempRepoRoot, { recursive: true, force: true })
        }
    })

    it('atomically relocates retired entity to _retired/, stamps tombstone metadata, and seals H_root', async () => {
        const receipt = await retireCanonicalEntity({
            seriesSlug,
            characterId: 'char_old_snag',
            departureType: 'death',
            resolutionCause: 'Collapsed in culvert sluice',
            departureEpoch: 105,
            itemTransfers: [
                {
                    item_id: 'item_brass_key',
                    disposition_type: 'TRANSFER_TO_CHARACTER',
                    recipient_character_id: 'char_wart',
                    target_partition: 'held',
                },
            ],
            repoRoot: tempRepoRoot,
        })

        expect(receipt.success).toBe(true)
        expect(receipt.byteZeroVerified).toBe(true)
        expect(receipt.rootMerkleHash).toMatch(/^[0-9a-f]{64}$/)
        expect(receipt.updatedPossessions).toEqual(['item_brass_key'])
        expect(receipt.archivedGrievances).toEqual(['grv_sluice_toll'])

        expect(fs.existsSync(receipt.oldPath)).toBe(false)
        expect(fs.existsSync(receipt.newPath)).toBe(true)

        const retiredRaw = fs.readFileSync(receipt.newPath, 'utf8')
        const parts = retiredRaw.split(/^---$/m)
        const fm = yaml.load(parts[1]) as Record<string, any>

        expect(fm.status).toBe('departed')
        expect(fm.banned_kinetic_verbs).toEqual(['*'])
        expect(fm.departure_epoch).toBe(105)
        expect(fm.departure_type).toBe('death')

        const archivedGrvPath = path.join(
            tempRepoRoot,
            'series',
            seriesSlug,
            'grievances',
            '_retired',
            'grv_sluice_toll.md',
        )
        expect(fs.existsSync(archivedGrvPath)).toBe(true)
    })

    it('halts in RAM without mutating disk when held possession lacks disposition', async () => {
        const receipt = await retireCanonicalEntity({
            seriesSlug,
            characterId: 'char_old_snag',
            departureType: 'missing',
            resolutionCause: 'Vanished into fog',
            departureEpoch: 106,
            itemTransfers: [],
            repoRoot: tempRepoRoot,
        })

        expect(receipt.success).toBe(false)
        expect(receipt.errorCode).toBe('DANGLING_RETIRED_CUSTODY_BREACH')

        expect(fs.existsSync(receipt.oldPath)).toBe(true)
        expect(fs.existsSync(receipt.newPath)).toBe(false)
    })
})
