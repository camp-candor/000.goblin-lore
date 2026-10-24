import * as fs from 'node:fs'
import * as path from 'node:path'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import type {
    ScratchpadDescriptor,
    EntityDomain,
} from '../fce/humanGate.bit.js'

export interface StageScratchpadInput {
    readonly seriesSlug: string
    readonly domain: EntityDomain
    readonly entityId: string
    readonly initialFrontmatter?: Record<string, any>
}

export const stageEntityScratchpad = (
    input: StageScratchpadInput,
): ScratchpadDescriptor => {
    const repoRoot = resolveRepoRoot()
    const domainDir = path.join(
        repoRoot,
        'series',
        input.seriesSlug,
        input.domain,
    )

    if (!fs.existsSync(domainDir)) {
        fs.mkdirSync(domainDir, { recursive: true })
    }

    const nonce = Date.now()
    const tmpFilename = `.tmp_${input.entityId}.${nonce}.md`
    const canonicalFilename = `${input.entityId}.md`
    const tmpFilePath = path.join(domainDir, tmpFilename)
    const canonicalFilePath = path.join(domainDir, canonicalFilename)

    let defaultYaml = ''
    switch (input.domain) {
        case 'characters':
            defaultYaml = [
                '---',
                `id: "${input.entityId}"`,
                `name: "${input.entityId
                    .replace(/^char_/, '')
                    .replace(/_/g, ' ')
                    .toUpperCase()}"`,
                'type: "character"',
                'staged_location_id: "loc_origin_hub"',
                'somatic:',
                '  locomotion_baseline: "BIPEDAL_HUNCHED"',
                '  available_arms_bps: 20000',
                '  banned_kinetic_verbs:',
                '    - "sprint"',
                '    - "vault"',
                'inventory:',
                '  worn: []',
                '  held_primary: null',
                '  held_offhand: null',
                '  carried: []',
                '  cached: []',
                'epistemic:',
                '  escalation_ceiling: 3',
                '  strings_held_over: []',
                '---',
                '',
                '## Wants (surface)',
                '<!-- What does the character claim they want during confrontations? -->',
                '',
                '## Wants (actual)',
                '<!-- What unspoken existential wound drives their behavior? -->',
                '',
                '## Blind spot',
                '<!-- What structural truth about their surroundings do they refuse to acknowledge? -->',
                '',
                '## Voice notes',
                '<!-- Monosyllabic cadences, forbidden words, dialect markers. -->',
                '',
            ].join('\n')
            break

        case 'locations':
            defaultYaml = [
                '---',
                `id: "${input.entityId}"`,
                `title: "${input.entityId
                    .replace(/^loc_/, '')
                    .replace(/_/g, ' ')
                    .toUpperCase()}"`,
                'axial_coords:',
                '  q: 1',
                '  r: 0',
                '  s: -1',
                'max_adult_occupants: 2',
                'acoustic_damping_cdb: 1500',
                'adjacent_locations:',
                '  - "loc_origin_hub"',
                'tags:',
                '  - "tactical"',
                '---',
                '',
                '## Visual Overview',
                '<!-- Physical geometry, lighting levels, and surface obstructions. -->',
                '',
                '## Acoustic Profile',
                '<!-- Ambient noise floor, partition loss, and reverberation characteristics. -->',
                '',
            ].join('\n')
            break

        case 'possessions':
            defaultYaml = [
                '---',
                `id: "${input.entityId}"`,
                `name: "${input.entityId
                    .replace(/^item_/, '')
                    .replace(/_/g, ' ')
                    .toUpperCase()}"`,
                'mass_grams: 50',
                'weight_class: "scrap"',
                'slot_category: "held"',
                'hands_required_bps: 10000',
                'custody_holder: "char_protagonist"',
                'material: "salvaged_iron"',
                'tags:',
                '  - "tool"',
                '---',
                '',
                '## Physical Description',
                '<!-- Surface wear, tactile heft, and mechanical tolerances. -->',
                '',
                '## Tactical Invariants',
                '<!-- Hand allocation requirements, structural limits, and acoustic signatures. -->',
                '',
            ].join('\n')
            break

        case 'grievances':
            defaultYaml = [
                '---',
                `id: "${input.entityId}"`,
                `title: "${input.entityId
                    .replace(/^grv_/, '')
                    .replace(/_/g, ' ')
                    .toUpperCase()}"`,
                'participants_primary:',
                '  - "char_protagonist"',
                'location_anchor: "loc_origin_hub"',
                'physical_anchor_prop: "item_founder_token"',
                'intensity_bounds_bps:',
                '  - 2000',
                '  - 8000',
                'cooldown_ticks: 12',
                'spawns_on_max_escalation: null',
                'tags:',
                '  - "conflict"',
                '---',
                '',
                '## Surface Argument',
                '<!-- The transactional grievance or object of vocal dispute. -->',
                '',
                '## The Underneath',
                '<!-- The deep relational wound and fear of vulnerability motivating the friction. -->',
                '',
            ].join('\n')
            break
    }

    // If initial frontmatter overrides are supplied, merge them
    let finalContent = defaultYaml
    if (input.initialFrontmatter) {
        const lines = defaultYaml.split('\n')
        const closingFenceIndex = lines.indexOf('---', 1)
        if (closingFenceIndex !== -1) {
            const body = lines.slice(closingFenceIndex + 1).join('\n')
            const mergedData = {
                ...input.initialFrontmatter,
                id: input.entityId,
            }
            const yamlBlocks = Object.entries(mergedData).map(
                ([k, v]) => `${k}: ${JSON.stringify(v)}`,
            )
            finalContent = `---\n${yamlBlocks.join('\n')}\n---${body}`
        }
    }

    fs.writeFileSync(tmpFilePath, finalContent, { encoding: 'utf-8' })

    return {
        entityId: input.entityId,
        domain: input.domain,
        seriesSlug: input.seriesSlug,
        tmpFilePath,
        canonicalFilePath,
        initialContent: finalContent,
    }
}
