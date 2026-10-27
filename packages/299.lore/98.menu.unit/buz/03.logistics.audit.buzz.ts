/* eslint-disable */
import {
    solveHandCapacitySAT,
    SomaticHandProfile,
    HandValidationItem,
} from '../../12.gear.unit/buz/gear.buzz.js'
import {
    LocationSchema,
    Location,
} from '../../01.location.unit/fce/spatial.schema.js'
import {
    calculateAcousticPropagation,
    validatePortalReciprocity,
} from '../../01.location.unit/buz/spatial.buzz.js'

export const SOMATIC_SAT_LABEL = '[ 2. Run Somatic SAT Solver ]'
export const AUDIT_PORTALS_LABEL = '[ 3. Audit Spatial Portals ]'

interface SatFixture {
    character: string
    somatic: SomaticHandProfile
    held: HandValidationItem[]
    expectValid: boolean
}

const SAT_FIXTURES: SatFixture[] = [
    {
        character: 'char_wart',
        somatic: { total_arms: 2, impairment_penalty_arms: 1 },
        held: [{ id: 'item_silver_spoon', occupies_hands: 1 }],
        expectValid: true,
    },
    {
        character: 'char_wart',
        somatic: { total_arms: 2, impairment_penalty_arms: 1 },
        held: [
            { id: 'item_silver_spoon', occupies_hands: 1 },
            { id: 'item_iron_chisel', occupies_hands: 1 },
        ],
        expectValid: false,
    },
    {
        character: 'char_bog',
        somatic: { total_arms: 2, impairment_penalty_arms: 0 },
        held: [
            { id: 'item_silver_spoon', occupies_hands: 1 },
            { id: 'item_dented_thimble', occupies_hands: 1 },
        ],
        expectValid: true,
    },
    {
        character: 'char_spleen',
        somatic: { total_arms: 2, impairment_penalty_arms: 3 },
        held: [{ id: 'item_scrap_pebble', occupies_hands: 1 }],
        expectValid: false,
    },
]

/**
 * Runs the REAL hand capacity SAT solver over the audit roster.
 * Returns cns00 telemetry; throws [GATE_3:FAILED] if the solver
 * mis-evaluates any fixture (valid allowed / over-allocation cut).
 */
export const runHandCapacityAudit = async (): Promise<string[]> => {
    const lines = ['>> [SAT:AUDIT] Hand capacity roster evaluation...']
    for (const fx of SAT_FIXTURES) {
        const result = solveHandCapacitySAT(fx.somatic, fx.held)
        if (result.valid !== fx.expectValid) {
            throw new Error(
                `[GATE_3:FAILED] SAT solver malfunction on ${fx.character}: expected valid=${fx.expectValid}, got ${result.valid}.`,
            )
        }
        if (result.valid) {
            lines.push(
                `>> [SAT:OK] ${fx.character}: ${result.occupied_hands}/${result.available_arms} hands - VALID`,
            )
        } else {
            lines.push(
                `:: [SAT_BREACH] ${fx.character}: demanded ${result.occupied_hands}, ${result.available_arms} arms - HAND_CAPACITY_EXCEEDED`,
            )
        }
    }
    lines.push('>> [GATE_3:PASSED] Hand capacity SAT sealed. Status code: 0.')
    return lines
}

const SAMPLE_TOPOLOGY = [
    {
        schema_version: 1,
        id: 'loc_warm_pipe',
        name: 'Warm Pipe',
        max_occupancy: 2,
        ambient_noise_cdb: 1500,
        temperature_bp: 6000,
        portals: [
            {
                portal_id: 'prt_pipe_out',
                target_location_id: 'loc_pantry_wall',
                target_portal_id: 'prt_pantry_in',
                acoustic_dampening_cdb: 1200,
                traversal_cost: 100,
                is_passable: true,
                is_latched: false,
            },
        ],
    },
    {
        schema_version: 1,
        id: 'loc_pantry_wall',
        name: 'Pantry Wall',
        max_occupancy: 4,
        ambient_noise_cdb: 2000,
        temperature_bp: 4000,
        portals: [
            {
                portal_id: 'prt_pantry_in',
                target_location_id: 'loc_warm_pipe',
                target_portal_id: 'prt_pipe_out',
                acoustic_dampening_cdb: 1200,
                traversal_cost: 100,
                is_passable: true,
                is_latched: false,
            },
        ],
    },
    {
        schema_version: 1,
        id: 'loc_crawlway',
        name: 'Crawlway',
        max_occupancy: 1,
        ambient_noise_cdb: 800,
        temperature_bp: 5000,
        portals: [
            {
                portal_id: 'prt_crawl_out',
                target_location_id: 'loc_pantry_wall',
                target_portal_id: 'prt_missing',
                acoustic_dampening_cdb: 2500,
                traversal_cost: 150,
                is_passable: true,
                is_latched: false,
            },
        ],
    },
]

/**
 * Runs the REAL portal reciprocity linter + acoustic propagator over
 * a sample topology. Throws [GATE_3:FAILED] on linter malfunction.
 */
export const runPortalReciprocityAudit = async (): Promise<string[]> => {
    const locations: Location[] = SAMPLE_TOPOLOGY.map((loc) =>
        LocationSchema.parse(loc),
    )
    const check = validatePortalReciprocity(locations)
    const traps = check.errors.filter((e) =>
        e.includes('ASYMMETRIC_PORTAL_TRAP'),
    )
    if (check.valid || traps.length !== 1) {
        throw new Error(
            `[GATE_3:FAILED] Reciprocity linter malfunction: expected 1 asymmetric trap, got ${traps.length} (valid=${check.valid}).`,
        )
    }

    const warmPipe = locations[0]
    const arrival = calculateAcousticPropagation(5000, [
        warmPipe.portals[0],
        locations[2].portals[0],
    ])
    if (arrival !== 1300) {
        throw new Error(
            `[GATE_3:FAILED] Acoustic drift: expected 1300 cdB arrival, got ${arrival}.`,
        )
    }

    return [
        `>> [PORTAL:AUDIT] Reciprocity analysis across ${locations.length} locations...`,
        '>> [PORTAL:OK] loc_warm_pipe <-> loc_pantry_wall reciprocal.',
        `:: [PORTAL_TRAP] ${traps[0]}`,
        '>> [ACOUSTIC:OK] 5000 cdB - 3700 cdB = 1300 cdB arrival.',
        '>> [GATE_3:PASSED] Spatial reciprocity sealed. Status code: 0.',
    ]
}
