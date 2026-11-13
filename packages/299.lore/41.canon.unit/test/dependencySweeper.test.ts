import { describe, it, expect } from 'vitest'
import {
    sweepActiveDependencies,
    sweepCorpusBlastRadius,
} from '../buz/dependencySweeper.buzz.js'
import type { ActiveDependencyEdge } from '../fce/dependencySweeper.bit.js'

describe('41.canon.unit :: Active Dependency Reference Sweeper', () => {
    const sampleGraph: ActiveDependencyEdge[] = [
        {
            source_id: 'scene_ep104_climax',
            target_id: 'char_wart',
            domain: 'SCENE_CASTING',
            source_standing: 'ACTIVE_ENDORSED',
            field_path: 'cast_ids[0]',
        },
        {
            source_id: 'grv_ration_shortage',
            target_id: 'char_wart',
            domain: 'GRIEVANCE_TARGET',
            source_standing: 'FLAGGED_FOR_REVIEW',
            field_path: 'target_entity_id',
        },
        {
            source_id: 'loc_upper_gallery',
            target_id: 'loc_culvert_siphon',
            domain: 'SPATIAL_PORTAL',
            source_standing: 'ACTIVE_ENDORSED',
            field_path: 'portal_links[0].target_location_id',
        },
        {
            source_id: 'scene_ep102_flashback',
            target_id: 'loc_upper_gallery',
            domain: 'SCENE_CASTING',
            source_standing: 'ACTIVE_ENDORSED',
            field_path: 'location_id',
        },
        {
            source_id: 'scene_ep100_pilot_cut',
            target_id: 'item_bent_spoon',
            domain: 'POSSESSION_LEASE',
            source_standing: 'DEPRECATED_ARCHIVED',
            field_path: 'held[0]',
        },
    ]

    it('halts retirement with ACTIVE_DEPENDENCY_LOCK when active referents exist', () => {
        const report = sweepActiveDependencies('char_wart', sampleGraph)

        expect(report.retirement_cleared).toBe(false)
        expect(report.active_in_degree).toBe(2)
        expect(report.errorCode).toBe('ACTIVE_DEPENDENCY_LOCK')
        expect(report.blocking_references).toHaveLength(2)

        expect(report.blocking_references[0].source_id).toBe(
            'grv_ration_shortage',
        )
        expect(report.blocking_references[1].source_id).toBe(
            'scene_ep104_climax',
        )
    })

    it('clears retirement when all incoming edges belong to DEPRECATED_ARCHIVED sources', () => {
        const report = sweepActiveDependencies('item_bent_spoon', sampleGraph)

        expect(report.retirement_cleared).toBe(true)
        expect(report.active_in_degree).toBe(0)
        expect(report.archived_in_degree_ignored).toBe(1)
        expect(report.blocking_references).toHaveLength(0)
        expect(report.errorCode).toBeUndefined()
    })

    it('computes direct and transitive multi-hop blast radius safely across cycles', () => {
        const cyclicGraph: ActiveDependencyEdge[] = [
            ...sampleGraph,
            {
                source_id: 'loc_culvert_siphon',
                target_id: 'loc_upper_gallery',
                domain: 'SPATIAL_PORTAL',
                source_standing: 'ACTIVE_ENDORSED',
                field_path: 'portal_links[1].target_location_id',
            },
        ]

        const blast = sweepCorpusBlastRadius('loc_culvert_siphon', cyclicGraph)

        expect(blast.direct_dependents).toEqual(['loc_upper_gallery'])
        expect(blast.transitive_dependents).toEqual([
            'loc_upper_gallery',
            'scene_ep102_flashback',
        ])
    })

    it('rejects malformed entity IDs with INVALID_ENTITY_ID', () => {
        expect(() =>
            sweepActiveDependencies('INVALID-ID', sampleGraph),
        ).toThrow(/INVALID_ENTITY_ID/)
    })
})
