import { describe, it, expect } from 'vitest'
import { GrievanceSchema, Grievance } from '../src/schemas/grievance.js'
import { FarceGate } from '../src/health/farceGate.js'
import {
    validateReciprocalSpatialTopology,
    wireReciprocalAdjacency,
    SpatialNode,
} from '../src/scaffolder/spatialGraph.js'
import {
    IngestionSoftLinker,
    EntityDictionary,
} from '../src/ingest/softLinker.js'

describe('Phase 3: Creative Ingestion Funnel, Grievance DAG & Farce Cap', () => {
    it('enforces strict schema contracts on canonical grievances', () => {
        const validGrievance: Grievance = {
            id: 'grv_stolen_flint',
            title: 'Dispute over the damp flint',
            category: 'resource_hoarding',
            participants_primary: ['char_bog', 'char_wart'],
            secondary_stakeholders: [],
            intensity_envelope: { min: 2, max: 4 },
            cooldown_cycles: 2,
            spawns_on_max_escalation: ['grv_cave_ouster'],
            tonal_override_eligible: false,
            associated_props: ['item_damp_flint'],
            associated_locations: ['loc_bog_corner'],
        }

        expect(GrievanceSchema.safeParse(validGrievance).success).toBe(true)

        // Reject non-distinct primary dyad
        const selfDispute = {
            ...validGrievance,
            participants_primary: ['char_bog', 'char_bog'],
        }
        expect(GrievanceSchema.safeParse(selfDispute).success).toBe(false)
    })

    it('audits farce ratio and halts on tonal degradation', () => {
        const gate = new FarceGate({ max_farce_ratio: 0.15 })

        const grievances: Grievance[] = [
            {
                id: 'grv_serious_1',
                title: 'Serious dispute 1',
                category: 'resource_hoarding',
                participants_primary: ['char_a', 'char_b'],
                secondary_stakeholders: [],
                intensity_envelope: { min: 2, max: 5 },
                cooldown_cycles: 1,
                spawns_on_max_escalation: [],
                tonal_override_eligible: false,
                associated_props: [],
                associated_locations: [],
            },
            {
                id: 'grv_farce_1',
                title: 'Silly spoon argument',
                category: 'domestic_farce',
                participants_primary: ['char_a', 'char_c'],
                secondary_stakeholders: [],
                intensity_envelope: { min: 1, max: 2 },
                cooldown_cycles: 1,
                spawns_on_max_escalation: [],
                tonal_override_eligible: true,
                associated_props: ['item_spoon'],
                associated_locations: [],
            },
        ]

        // 1 farce out of 2 = 50% > 15% -> TONAL_DEGRADATION_BREACH
        const audit1 = gate.auditFarceInvariants(grievances)
        expect(audit1.passed).toBe(false)
        expect(
            audit1.violations.some(
                (v) => v.code === 'TONAL_DEGRADATION_BREACH',
            ),
        ).toBe(true)

        // Farce grievance attempting to spawn child grievance
        const invalidFarce: Grievance = {
            ...grievances[1],
            spawns_on_max_escalation: ['grv_serious_1'],
        }
        const audit2 = gate.auditFarceInvariants([invalidFarce])
        expect(
            audit2.violations.some(
                (v) => v.code === 'FARCE_CHILD_SPAWN_BREACH',
            ),
        ).toBe(true)

        // Farce prop colliding with mystery clue token
        const audit3 = gate.auditFarceInvariants(
            [grievances[1]],
            ['item_spoon'],
        )
        expect(
            audit3.violations.some(
                (v) => v.code === 'FARCE_EPISTEMIC_COLLISION',
            ),
        ).toBe(true)
    })

    it('detects asymmetric spatial links and wires reciprocal connections', () => {
        const map = new Map<string, SpatialNode>()
        map.set('loc_gate', {
            id: 'loc_gate',
            connected_locations: ['loc_hall'],
        })
        map.set('loc_hall', { id: 'loc_hall', connected_locations: [] }) // Asymmetric missing link

        const audit1 = validateReciprocalSpatialTopology(map)
        expect(audit1.valid).toBe(false)
        expect(audit1.errors[0].message).toContain(
            'Asymmetric spatial topology',
        )

        // Automatically wire reciprocal connection
        wireReciprocalAdjacency(map.get('loc_gate')!, map.get('loc_hall')!)
        const audit2 = validateReciprocalSpatialTopology(map)
        expect(audit2.valid).toBe(true)
    })

    it('scans raw text drops and tags entities without altering prose', () => {
        const dict: EntityDictionary = {
            characters: new Map([
                ['char_bog', ['bog', 'boggie']],
                ['char_wart', ['wart']],
            ]),
            locations: new Map([['loc_culvert', ['culvert', 'drainage pipe']]]),
            possessions: new Map([['item_siphon', ['siphon', 'brass pump']]]),
        }

        const linker = new IngestionSoftLinker(dict)
        const rawProse =
            'Bog dropped the brass pump inside the drainage pipe before Wart arrived.'

        const result = linker.scanProse(rawProse)
        expect(result.candidateCharacters).toContain('char_bog')
        expect(result.candidateCharacters).toContain('char_wart')
        expect(result.candidateLocations).toContain('loc_culvert')
        expect(result.candidatePossessions).toContain('item_siphon')
        // Ensure raw string remains unmodified
        expect(rawProse).toBe(
            'Bog dropped the brass pump inside the drainage pipe before Wart arrived.',
        )
    })
})
