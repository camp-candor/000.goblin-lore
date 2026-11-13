import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import type CustomSeedBit from '../fce/customSeed.bit.js'
import { resolveRepoRoot } from '../../29.series.unit/buz/scaffoldSeriesTree.buzz.js'
import { verifyByteZeroBuffer } from './seedWorldDefinitions.buzz.js'

function sanitizeSeedId(raw: string | undefined, fallback: string): string {
    const cleaned = String(raw || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '')
    return cleaned.length > 0 ? cleaned : fallback
}

export const injectCustomSeedIdentifiers = async (
    cpy: any,
    bal: CustomSeedBit,
    _ste?: State,
): Promise<any> => {
    const dat = (bal as any).dat || {}
    const seriesSlug = (bal as any).src || dat.seriesSlug
    const customIds = dat.customIdentifiers || {}

    if (!seriesSlug) {
        if (bal.slv) {
            bal.slv({
                seedBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: 'MISSING_SERIES_SLUG' },
                },
            })
        }
        return cpy
    }

    const repoRoot = dat.repoRoot || resolveRepoRoot()
    const seriesDir = path.join(repoRoot, 'series', seriesSlug)

    const charId = sanitizeSeedId(customIds.characterId, 'char_wonder_woman')
    const locId = sanitizeSeedId(customIds.locationId, 'loc_gotham_rooftop')
    const itemId = sanitizeSeedId(customIds.possessionId, 'item_lasso_of_truth')
    const grvId = sanitizeSeedId(customIds.grievanceId, 'grv_gotham_standoff')

    const charsDir = path.join(seriesDir, 'characters')
    const locsDir = path.join(seriesDir, 'locations')
    const possDir = path.join(seriesDir, 'possessions')
    const grvDir = path.join(seriesDir, 'grievances')

    for (const d of [charsDir, locsDir, possDir, grvDir]) {
        if (!fs.existsSync(d)) {
            fs.mkdirSync(d, { recursive: true })
        }
    }

    const charPath = path.join(charsDir, `${charId}.md`)
    const charContent = [
        '---',
        `id: "${charId}"`,
        'title: "Wonder Woman"',
        'available_arms_bps: 20000',
        'locomotion_baseline: "bipedal_standard"',
        `held_primary: "${itemId}"`,
        'tags:',
        '  - "protagonist"',
        '  - "hero"',
        '---',
        '',
        '## Wants (surface)',
        'To preserve civilian order without compromising absolute ethical boundaries.',
        '',
        '## Wants (actual)',
        'To reconcile the chasm between divine mandate and flawed human chaos.',
        '',
    ].join('\n')
    fs.writeFileSync(charPath, charContent, { encoding: 'utf8' })

    const locPath = path.join(locsDir, `${locId}.md`)
    const locContent = [
        '---',
        `id: "${locId}"`,
        'title: "Gotham Rooftop"',
        'axial_coords:',
        '  q: 0',
        '  r: 0',
        '  s: 0',
        'max_adult_occupants: 4',
        'acoustic_damping_cdb: 1200',
        'tags:',
        '  - "location"',
        '  - "exterior"',
        '---',
        '',
        '## Overview',
        'Cold limestone gargoyles overlook the endless neon canyons of Gotham City.',
        '',
    ].join('\n')
    fs.writeFileSync(locPath, locContent, { encoding: 'utf8' })

    const itemPath = path.join(possDir, `${itemId}.md`)
    const itemContent = [
        '---',
        `id: "${itemId}"`,
        'name: "Lasso of Truth"',
        'mass_grams: 1200',
        'weight_class: "weight"',
        'slot_category: "held"',
        'hands_required_bps: 10000',
        `custody_holder: "${charId}"`,
        'tags:',
        '  - "artifact"',
        '  - "weapon"',
        '---',
        '',
        '## Description',
        'A golden cord forged from divine metallurgy that compels absolute veracity.',
        '',
    ].join('\n')
    fs.writeFileSync(itemPath, itemContent, { encoding: 'utf8' })

    const grvPath = path.join(grvDir, `${grvId}.md`)
    const grvContent = [
        '---',
        `id: "${grvId}"`,
        'title: "Gotham Standoff"',
        `participants_primary: ["${charId}"]`,
        `location_anchor: "${locId}"`,
        `physical_anchor_prop: "${itemId}"`,
        'intensity_bounds_bps: [3000, 9000]',
        'cooldown_ticks: 5',
        'tags:',
        '  - "grievance"',
        '  - "conflict"',
        '---',
        '',
        '## Surface Argument',
        'Jurisdiction and custody over the detonator amidst torrential rain.',
        '',
    ].join('\n')
    fs.writeFileSync(grvPath, grvContent, { encoding: 'utf8' })

    const allBytes = Buffer.concat([
        fs.readFileSync(charPath),
        fs.readFileSync(locPath),
        fs.readFileSync(itemPath),
        fs.readFileSync(grvPath),
    ])
    const byteZeroVerified = verifyByteZeroBuffer(allBytes)

    const receipt = {
        seriesSlug,
        injectedIds: {
            characterId: charId,
            locationId: locId,
            possessionId: itemId,
            grievanceId: grvId,
        },
        totalInjected: 4,
        byteZeroVerified,
    }

    if (bal.slv) {
        bal.slv({
            seedBit: {
                idx: bal.idx,
                val: 1,
                dat: receipt,
            },
        })
    }

    return cpy
}
