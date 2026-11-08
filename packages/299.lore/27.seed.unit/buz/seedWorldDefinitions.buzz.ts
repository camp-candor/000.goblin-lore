import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import type { CreatedSeedDossier } from '../fce/seed.bit.js'

/**
 * Asserts that a byte buffer opens with '---' at byte 0.
 */
export function verifyByteZeroBuffer(buf: Buffer): boolean {
    if (buf.length < 4) return false
    return (
        buf[0] === 0x2d && // '-'
        buf[1] === 0x2d && // '-'
        buf[2] === 0x2d && // '-'
        buf[3] === 0x0a // '\n'
    )
}

/**
 * Emits series/<slug>/world/conditions.md and world/economy.md at Byte 0.
 */
export function seedWorldDefinitions(
    seriesDir: string,
    seriesSlug: string,
): CreatedSeedDossier[] {
    const worldDir = path.join(seriesDir, 'world')
    if (!fs.existsSync(worldDir)) {
        fs.mkdirSync(worldDir, { recursive: true })
    }

    const results: CreatedSeedDossier[] = []

    // 1. world/conditions.md
    const conditionsPath = path.join(worldDir, 'conditions.md')
    const conditionsContent = [
        '---',
        'id: "world_conditions_registry"',
        'title: "Canonical World Conditions"',
        'type: "conditions_catalog"',
        'version: 1',
        'conditions:',
        '  - condition_slug: "cnd_baseline_fatigue"',
        '    title: "Baseline Environmental Exhaustion"',
        '    arm_penalty_bps: 0',
        '    velocity_penalty_bps: 500',
        '    chronic_fatigue_floor_bps: 1000',
        '    chronic_pain_floor_bps: 0',
        '    chronic_refusal_strain_floor_bps: 500',
        '    chronic_paranoia_floor_bps: 1000',
        '    auditory_debuff_cdb: 0',
        '    banned_verbs: []',
        '    dsp_deltas:',
        '      pitch_shift_centitones: 0',
        '      formant_warping_bps: 10000',
        '      vocal_fry_density_bps: 1000',
        '      breathiness_pause_bps: 10000',
        '      banned_cadences: []',
        '---',
        '',
        '## World Conditions Overview',
        'Standard atmospheric drag and respiratory strain across the baseline sector.',
        '',
    ].join('\n')

    fs.writeFileSync(conditionsPath, conditionsContent, { encoding: 'utf8' })
    const condBytes = fs.readFileSync(conditionsPath)
    results.push({
        id: 'world_conditions_registry',
        domain: 'world',
        relativePath: `series/${seriesSlug}/world/conditions.md`,
        absolutePath: conditionsPath,
        byteZeroVerified: verifyByteZeroBuffer(condBytes),
        contentSha256: crypto
            .createHash('sha256')
            .update(condBytes)
            .digest('hex'),
    })

    // 2. world/economy.md
    const economyPath = path.join(worldDir, 'economy.md')
    const economyContent = [
        '---',
        'id: "world_economy_registry"',
        'title: "Canonical Mass and Weight Class Tiers"',
        'type: "economy_catalog"',
        'version: 1',
        'tiers:',
        '  scrap:',
        '    max_grams: 50',
        '    description: "Lightweight salvage and pocket brass"',
        '  weight:',
        '    max_grams: 5000',
        '    description: "Heavy structural scrap and ballast"',
        '  bulk:',
        '    min_grams: 5001',
        '    description: "Immobile architectural components"',
        '---',
        '',
        '## Physical Economy Invariants',
        'Material possession mass categories determining somatic carrying strain.',
        '',
    ].join('\n')

    fs.writeFileSync(economyPath, economyContent, { encoding: 'utf8' })
    const econBytes = fs.readFileSync(economyPath)
    results.push({
        id: 'world_economy_registry',
        domain: 'world',
        relativePath: `series/${seriesSlug}/world/economy.md`,
        absolutePath: economyPath,
        byteZeroVerified: verifyByteZeroBuffer(econBytes),
        contentSha256: crypto
            .createHash('sha256')
            .update(econBytes)
            .digest('hex'),
    })

    return results
}
