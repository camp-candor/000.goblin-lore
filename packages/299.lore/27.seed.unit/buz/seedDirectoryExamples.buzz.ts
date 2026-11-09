import * as fs from 'node:fs'
import * as path from 'node:path'
import { seedWorldDefinitions } from './seedWorldDefinitions.buzz.js'
import { seedOriginHub } from './seedOriginHub.buzz.js'

/**
 * Populates a series directory with comprehensive generic examples showcasing
 * every possible entity family and directory structure.
 */
export function seedDirectoryExamples(
    seriesDir: string,
    seriesSlug: string,
): string[] {
    const createdFiles: string[] = []

    const ensureDir = (dirPath: string) => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
        }
    }

    // 0a. world/conditions.md and world/economy.md
    const worldDir = path.join(seriesDir, 'world')
    ensureDir(worldDir)
    const conditionsPath = path.join(worldDir, 'conditions.md')
    const economyPath = path.join(worldDir, 'economy.md')
    if (!fs.existsSync(conditionsPath) || !fs.existsSync(economyPath)) {
        const seededWorld = seedWorldDefinitions(seriesDir, seriesSlug)
        for (const doc of seededWorld) {
            createdFiles.push(doc.absolutePath)
        }
    }

    // 0b. locations/loc_origin_hub.md
    const locDir = path.join(seriesDir, 'locations')
    ensureDir(locDir)
    const hubPath = path.join(locDir, 'loc_origin_hub.md')
    if (!fs.existsSync(hubPath)) {
        const hubDoc = seedOriginHub(seriesDir, seriesSlug)
        createdFiles.push(hubDoc.absolutePath)
    }

    // 1. characters/char_example_character.md
    const charDir = path.join(seriesDir, 'characters')
    ensureDir(charDir)
    const charProtagonistPath = path.join(charDir, 'char_example_character.md')
    if (!fs.existsSync(charProtagonistPath)) {
        const content = [
            '---',
            'id: "char_example_character"',
            'name: "Example Character"',
            'title: "Exemplar Protagonist"',
            'type: "character"',
            'machineRail:',
            '  id: "char_example_character"',
            '  somatic:',
            '    locomotion_baseline: "bipedal_standard"',
            '    conditions:',
            '      - "cnd_baseline_fatigue"',
            '    banned_kinetic_verbs:',
            '      - "sit_still"',
            '      - "freeze_posture"',
            '  logistical:',
            '    held_primary: "item_example_possession"',
            '    weight_capacity_bp: 5000',
            '  epistemic:',
            '    paranoia_bp: 2500',
            '    trust_bp: 3000',
            '    escalation_ceiling: 3',
            '---',
            '',
            '# Example Character Dossier',
            '',
            `An exemplar protagonist for series '${seriesSlug}', showcasing baseline somatic locomotion, logistical item holding, and basis-point epistemic pressures.`,
            '',
        ].join('\n')
        fs.writeFileSync(charProtagonistPath, content, 'utf8')
        createdFiles.push(charProtagonistPath)
    }

    // 2. characters/char_example_rival_character.md
    const charRivalPath = path.join(charDir, 'char_example_rival_character.md')
    if (!fs.existsSync(charRivalPath)) {
        const content = [
            '---',
            'id: "char_example_rival_character"',
            'name: "Example Rival Character"',
            'title: "Exemplar Antagonist"',
            'type: "character"',
            'machineRail:',
            '  id: "char_example_rival_character"',
            '  somatic:',
            '    locomotion_baseline: "bipedal_hunched"',
            '    conditions: []',
            '    banned_kinetic_verbs:',
            '      - "sprint"',
            '  logistical:',
            '    held_primary: null',
            '    weight_capacity_bp: 4500',
            '  epistemic:',
            '    paranoia_bp: 4000',
            '    trust_bp: 1500',
            '    escalation_ceiling: 4',
            '---',
            '',
            '# Example Rival Character Dossier',
            '',
            `An exemplar rival character for series '${seriesSlug}', demonstrating oppositional posture, elevated paranoia baseline, and participant linkage in canonical grievances.`,
            '',
        ].join('\n')
        fs.writeFileSync(charRivalPath, content, 'utf8')
        createdFiles.push(charRivalPath)
    }

    // 3. characters/_retired/char_example_retired_character.md
    const charRetiredDir = path.join(charDir, '_retired')
    ensureDir(charRetiredDir)
    const charRetiredPath = path.join(
        charRetiredDir,
        'char_example_retired_character.md',
    )
    if (!fs.existsSync(charRetiredPath)) {
        const content = [
            '---',
            'id: "char_example_retired_character"',
            'name: "Example Retired Character"',
            'title: "Formally Archived Veteran"',
            'type: "character"',
            'status: "RETIRED"',
            'retirement_metadata:',
            '  retired_at_epoch: 1730000000',
            '  matter_conserved: true',
            '  transferred_items:',
            '    item_example_possession: "char_example_character"',
            'machineRail:',
            '  id: "char_example_retired_character"',
            '  somatic:',
            '    locomotion_baseline: "immobile"',
            '    conditions: []',
            '    banned_kinetic_verbs: []',
            '  logistical:',
            '    held_primary: null',
            '  epistemic:',
            '    paranoia_bp: 0',
            '    trust_bp: 5000',
            '---',
            '',
            '# Example Retired Character Dossier [RETIRED]',
            '',
            `An exemplar retired character dossier in '${seriesSlug}', showcasing archival status, matter conservation invariants, and documented item transfers.`,
            '',
        ].join('\n')
        fs.writeFileSync(charRetiredPath, content, 'utf8')
        createdFiles.push(charRetiredPath)
    }

    // 4. locations/loc_example_waypoint_location.md
    ensureDir(locDir)
    const locWaypointPath = path.join(
        locDir,
        'loc_example_waypoint_location.md',
    )
    if (!fs.existsSync(locWaypointPath)) {
        const content = [
            '---',
            'id: "loc_example_waypoint_location"',
            'title: "Example Waypoint Location"',
            'type: "location"',
            'axial_coordinates:',
            '  q: 1',
            '  r: -1',
            '  s: 0',
            'max_adult_occupants: 4',
            'acoustic_damping_cdb: 1200',
            'lighting: "filtered_crevice"',
            'portal_links:',
            '  - target_loc: "loc_origin_hub"',
            '    edge_type: "OPEN"',
            '    traversal_cost_bp: 150',
            'tags:',
            '  - "waypoint"',
            '  - "exterior"',
            '---',
            '',
            '## Visual Overview',
            '',
            `An exemplar peripheral waypoint in '${seriesSlug}' connected to the origin convergence hub via open portal links.`,
            '',
            '## Acoustic Profile',
            '',
            'Standard acoustic attenuation with balanced reverberation times across portal edges.',
            '',
        ].join('\n')
        fs.writeFileSync(locWaypointPath, content, 'utf8')
        createdFiles.push(locWaypointPath)

        // Ensure reciprocal portal link in loc_origin_hub if it exists with empty portals
        if (fs.existsSync(hubPath)) {
            const hubRaw = fs.readFileSync(hubPath, 'utf8')
            if (hubRaw.includes('portal_links: []')) {
                const updatedHub = hubRaw.replace(
                    'portal_links: []',
                    [
                        'portal_links:',
                        '  - target_loc: "loc_example_waypoint_location"',
                        '    edge_type: "OPEN"',
                        '    traversal_cost_bp: 150',
                    ].join('\n'),
                )
                fs.writeFileSync(hubPath, updatedHub, 'utf8')
            }
        }
    }

    // 5. possessions/item_example_possession.md
    const posDir = path.join(seriesDir, 'possessions')
    ensureDir(posDir)
    const itemPath = path.join(posDir, 'item_example_possession.md')
    if (!fs.existsSync(itemPath)) {
        const content = [
            '---',
            'schema_version: 1',
            'id: "item_example_possession"',
            'name: "Example Possession Item"',
            'type: "possession"',
            'owner_id: "char_example_character"',
            'weight_class: "SHINE"',
            'mass_g: 150',
            'occupies_hands: 1',
            'contested_by: []',
            'linked_grievances:',
            '  - "grv_example_grievance"',
            '---',
            '',
            '# Item: Example Possession Item',
            '',
            `An exemplar physical item in '${seriesSlug}' showcasing weight class categorization, hand occupancy allocation, and grievance linkages.`,
            '',
        ].join('\n')
        fs.writeFileSync(itemPath, content, 'utf8')
        createdFiles.push(itemPath)
    }

    // 6. grievances/grv_example_grievance.md
    const grvDir = path.join(seriesDir, 'grievances')
    ensureDir(grvDir)
    const grvPath = path.join(grvDir, 'grv_example_grievance.md')
    if (!fs.existsSync(grvPath)) {
        const content = [
            '---',
            'id: "grv_example_grievance"',
            'title: "Example Dyadic Grievance"',
            'type: "grievance"',
            'category: "RESOURCE_HOARDING"',
            'participants_primary:',
            '  - "char_example_character"',
            '  - "char_example_rival_character"',
            'intensity_bp: 2500',
            'escalation_ceiling_bp: 7500',
            'cooldown_ticks: 3',
            'spawns_on_max_escalation: []',
            'outcomes:',
            '  clean_win:',
            '    mechanics: "Example character secures the disputed resource cleanly."',
            '    somatic_cost_bp: 150',
            '    strings_transferred: 1',
            '  costly_win:',
            '    mechanics: "Example character secures the resource with minor somatic fatigue."',
            '    somatic_cost_bp: 900',
            '    strings_transferred: 1',
            '  mutual_wound:',
            '    mechanics: "Both participants sustain reciprocal somatic strain."',
            '    somatic_cost_bp: 1800',
            '    strings_transferred: 0',
            '  backfire:',
            '    mechanics: "The grievance dispute backfires and the resource is dropped."',
            '    somatic_cost_bp: 2500',
            '    strings_transferred: -1',
            '---',
            '',
            '# Grievance: Example Dyadic Grievance',
            '',
            `An exemplar dyadic grievance in '${seriesSlug}' between two primary participants demonstrating intensity scaling and 4-way outcome resolution.`,
            '',
        ].join('\n')
        fs.writeFileSync(grvPath, content, 'utf8')
        createdFiles.push(grvPath)
    }

    // 7. grievances/_retired/grv_example_retired_grievance.md
    const grvRetiredDir = path.join(grvDir, '_retired')
    ensureDir(grvRetiredDir)
    const grvRetiredPath = path.join(
        grvRetiredDir,
        'grv_example_retired_grievance.md',
    )
    if (!fs.existsSync(grvRetiredPath)) {
        const content = [
            '---',
            'id: "grv_example_retired_grievance"',
            'title: "Example Settled Historical Grievance"',
            'type: "grievance"',
            'status: "RETIRED"',
            'retirement_metadata:',
            '  settled_at_epoch: 1730000000',
            '  settlement_type: "MUTUAL_AMICABLE_TRUCE"',
            'category: "TERRITORIAL_INTRUSION"',
            'participants_primary:',
            '  - "char_example_character"',
            '  - "char_example_retired_character"',
            'intensity_bp: 0',
            'escalation_ceiling_bp: 5000',
            '---',
            '',
            '# Grievance [RETIRED]: Example Settled Historical Grievance',
            '',
            `An exemplar tombstoned grievance in '${seriesSlug}' showing historical settlement metadata and clean cessation of active escalation.`,
            '',
        ].join('\n')
        fs.writeFileSync(grvRetiredPath, content, 'utf8')
        createdFiles.push(grvRetiredPath)
    }

    // 8. ontology/unresolved.json
    const ontDir = path.join(seriesDir, 'ontology')
    ensureDir(ontDir)
    const unresolvedPath = path.join(ontDir, 'unresolved.json')
    let shouldWriteMystery = true
    if (fs.existsSync(unresolvedPath)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(unresolvedPath, 'utf8'))
            if (Array.isArray(parsed) && parsed.length > 0) {
                shouldWriteMystery = false
            }
        } catch {
            shouldWriteMystery = true
        }
    }
    if (shouldWriteMystery) {
        const mysteryContent = JSON.stringify(
            [
                {
                    topic_id: 'mystery_example_unresolved_truth',
                    description:
                        'An exemplar unresolved mystery demonstrating Clue-Lemma Disjointness and epistemic horizons.',
                    forbidden_propositions: [
                        'The truth was revealed by human intervention.',
                        'The sealed vault was breached from the outside.',
                    ],
                    trigger_lemma_sets: [
                        ['vault', 'breach', 'lock'],
                        ['origin', 'founder', 'archive'],
                    ],
                    permitted_clue_tokens: [
                        'scratched keyway',
                        'faded blueprint',
                        'bent copper pin',
                    ],
                    epistemic_horizons: {
                        char_example_character: 'PARTIAL_OBSERVATION',
                        char_example_rival_character: 'FALSE_BELIEF',
                    },
                    distorted_beliefs: {
                        char_example_rival_character:
                            'Believes the key was stolen by an external scavenger clan.',
                    },
                    human_promotion_condition:
                        'Operator confirms physical verification of the bent copper pin in two separate scenes.',
                },
            ],
            null,
            2,
        )
        fs.writeFileSync(unresolvedPath, `${mysteryContent}\n`, 'utf8')
        createdFiles.push(unresolvedPath)
    }

    // 9. pardons/pardon_example_rule_waiver.json
    const pardonsDir = path.join(seriesDir, 'pardons')
    ensureDir(pardonsDir)
    const pardonPath = path.join(pardonsDir, 'pardon_example_rule_waiver.json')
    if (!fs.existsSync(pardonPath)) {
        const pardonContent = JSON.stringify(
            {
                id: 'pardon_example_rule_waiver',
                target: {
                    episode_id: 'ep001',
                    scene_id: 'sc001',
                    shot_id: 'sh001',
                    entity_id: 'char_example_character',
                },
                rule_id: 'rule_carrying_capacity',
                authorizer_id: 'auth_showrunner_main',
                justification:
                    'Temporary mass limit waiver granted during emergency exemplar sequence.',
                granted_against_canon_hash:
                    '0000000000000000000000000000000000000000000000000000000000000000',
                status: 'ACTIVE',
            },
            null,
            2,
        )
        fs.writeFileSync(pardonPath, `${pardonContent}\n`, 'utf8')
        createdFiles.push(pardonPath)
    }

    return createdFiles
}
