import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import type { CreatedSeedDossier } from '../fce/seed.bit.js'
import {
    resolveChronologyConfig,
    DEFAULT_CHRONOLOGY_CONFIG,
} from '../../38.types.unit/fce/chronology.interface.js'
import {
    resolveAutoScriptConfig,
    DEFAULT_AUTO_SCRIPT_CONFIG,
} from '../../38.types.unit/fce/autoScriptRule.interface.js'
import { parseCalendarStart } from '../../05.clock.unit/buz/clock.buzz.js'

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

    // 3. world/chronology.md
    try {
        const chronologyPath = path.join(worldDir, 'chronology.md')
        const chronologyContent = buildChronologyWorldDossier(
            DEFAULT_CHRONOLOGY_CONFIG,
            seriesSlug,
        )
        const normalizedChronology = chronologyContent
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '')
        fs.writeFileSync(chronologyPath, normalizedChronology, {
            encoding: 'utf8',
        })
        const chronoBytes = fs.readFileSync(chronologyPath)
        results.push({
            id: 'world_chronology',
            domain: 'world',
            relativePath: `series/${seriesSlug}/world/chronology.md`,
            absolutePath: chronologyPath,
            byteZeroVerified: verifyByteZeroBuffer(chronoBytes),
            contentSha256: crypto
                .createHash('sha256')
                .update(chronoBytes)
                .digest('hex'),
        })
    } catch {
        // ignore
    }

    // 4. world/dramatic-catalysts.md
    try {
        const catalystsPath = path.join(worldDir, 'dramatic-catalysts.md')
        const catalystsContent = buildDramaticCatalystsDossier(
            DEFAULT_AUTO_SCRIPT_CONFIG,
            seriesSlug,
        )
        const normalizedCatalysts = catalystsContent
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '')
        fs.writeFileSync(catalystsPath, normalizedCatalysts, {
            encoding: 'utf8',
        })
        const catBytes = fs.readFileSync(catalystsPath)
        results.push({
            id: 'world_dramatic_catalysts',
            domain: 'world',
            relativePath: `series/${seriesSlug}/world/dramatic-catalysts.md`,
            absolutePath: catalystsPath,
            byteZeroVerified: verifyByteZeroBuffer(catBytes),
            contentSha256: crypto
                .createHash('sha256')
                .update(catBytes)
                .digest('hex'),
        })
    } catch {
        // ignore
    }

    return results
}

export function buildChronologyWorldDossier(
    chronology: any,
    seriesSlug: string,
): string {
    const cfg = resolveChronologyConfig(chronology ?? {})
    const snap = parseCalendarStart(cfg)
    const lines = [
        '---',
        'id: world_chronology',
        'entity_type: world_chronology',
        `series_slug: ${seriesSlug}`,
        'calendar_system: GREGORIAN_24H',
        `start_date: ${cfg.start_date}`,
        `start_time: ${cfg.start_time}`,
        `tick_seconds: ${cfg.tick_seconds}`,
        `frames_per_second: ${cfg.frames_per_second}`,
        `daypart: ${snap.daypart}`,
        `timezone_label: ${cfg.timezone_label}`,
        `era_label: ${cfg.era_label}`,
        'status: active',
        '---',
        '',
        '# Canonical Chronology Anchor',
        '',
        `This series opens at **${cfg.start_date} ${cfg.start_time}** (\`${snap.daypart}\`, \`${cfg.timezone_label}\`) at a cadence of **${cfg.tick_seconds}s per simulation tick** (\`${cfg.frames_per_second} fps\` SMPTE projection).`,
        '',
    ]
    return lines.join('\n')
}

export function buildDramaticCatalystsDossier(
    autoScript: any,
    seriesSlug: string,
): string {
    const cfg = resolveAutoScriptConfig(autoScript ?? {})
    const lines = [
        '---',
        'id: world_dramatic_catalysts',
        'entity_type: world_dramatic_catalysts',
        `series_slug: ${seriesSlug}`,
        `enabled: ${cfg.enabled ? 'true' : 'false'}`,
        `min_global_significance_bps: ${cfg.min_global_significance_bps}`,
        `max_scripts_per_run: ${cfg.max_scripts_per_run}`,
        `output_subdir: ${cfg.output_subdir}`,
        'status: active',
        'triggers:',
        ...cfg.rules
            .slice()
            .sort((a, b) =>
                a.category < b.category ? -1 : a.category > b.category ? 1 : 0,
            )
            .map(
                (r) =>
                    `  - category: ${r.category} | enabled: ${r.enabled ? 'true' : 'false'} | min_severity_bps: ${r.min_severity_bps} | cooldown_ticks: ${r.cooldown_ticks} | priority_weight_bps: ${r.priority_weight_bps}`,
            ),
        '---',
        '',
        '# Dramatic Catalysts',
        '',
        `Active trigger categories for series ${seriesSlug}.`,
        `Global significance floor is ${cfg.min_global_significance_bps} bps.`,
        `Generated screenplays emit to ${cfg.output_subdir}/.`,
        '',
    ]
    return lines.join('\n')
}

export const buildChronologyDossier = buildChronologyWorldDossier

export function seedChronologyDossier(
    seriesDir: string,
    seriesSlug: string,
    chronology: any,
): any {
    const worldDir = path.join(seriesDir, 'world')
    if (!fs.existsSync(worldDir)) {
        fs.mkdirSync(worldDir, { recursive: true })
    }
    const content = buildChronologyWorldDossier(chronology, seriesSlug)
    const filePath = path.join(worldDir, 'chronology.md')
    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '')
    fs.writeFileSync(filePath, normalized, { encoding: 'utf8' })
    const buf = fs.readFileSync(filePath)
    return {
        id: 'world_chronology',
        domain: 'world',
        relativePath: `series/${seriesSlug}/world/chronology.md`,
        absolutePath: filePath,
        byteZeroVerified: verifyByteZeroBuffer(buf),
        contentSha256: crypto.createHash('sha256').update(buf).digest('hex'),
    }
}

export const seedChronologyWorldDossier = seedChronologyDossier

export function seedDramaticCatalystsDossier(
    seriesDir: string,
    seriesSlug: string,
    autoScriptConfig?: any,
): CreatedSeedDossier {
    const worldDir = path.join(seriesDir, 'world')
    if (!fs.existsSync(worldDir)) {
        fs.mkdirSync(worldDir, { recursive: true })
    }
    const content = buildDramaticCatalystsDossier(autoScriptConfig, seriesSlug)
    const filePath = path.join(worldDir, 'dramatic-catalysts.md')
    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '')
    fs.writeFileSync(filePath, normalized, { encoding: 'utf8' })
    const buf = fs.readFileSync(filePath)
    return {
        id: 'world_dramatic_catalysts',
        domain: 'world',
        relativePath: `series/${seriesSlug}/world/dramatic-catalysts.md`,
        absolutePath: filePath,
        byteZeroVerified: verifyByteZeroBuffer(buf),
        contentSha256: crypto.createHash('sha256').update(buf).digest('hex'),
    }
}
