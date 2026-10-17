import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import {
    AxialCoordinateSchema,
    ActorPhysicalPlacementSchema,
    ItemPhysicalPlacementSchema,
    WorldPhysicalManifestSchema,
} from '../src/schemas/physicalPlacement.js'
import type { WorldPhysicalManifest } from '../src/schemas/physicalPlacement.js'
import { SpatialPresenceSolver } from '../src/scaffolder/spatialPresenceSolver.js'

describe('Ground-Truth Physical State: Spatial Presence & Item Disjointness', () => {
    let db: Database.Database

    beforeEach(() => {
        db = new Database(':memory:')
    })

    afterEach(() => {
        db.close()
    })

    it('enforces axial hex coordinate cube invariant (q + r + s === 0)', () => {
        const validCoord = { q: 1, r: -2, s: 1 }
        expect(() => AxialCoordinateSchema.parse(validCoord)).not.toThrow()

        const invalidCoord = { q: 1, r: 2, s: 1 }
        expect(() => AxialCoordinateSchema.parse(invalidCoord)).toThrow(
            /AXIAL_COORDINATE_CUBE_INVARIANT_BREACH/,
        )
    })

    it('rejects floating-point coordinates and applies integer defaults', () => {
        expect(() =>
            AxialCoordinateSchema.parse({ q: 0.5, r: 0, s: -0.5 }),
        ).toThrow()
        const actor = ActorPhysicalPlacementSchema.parse({
            actor_id: 'char_silas',
            room_id: 'loc_culvert',
        })
        expect(actor.scale).toBe('STAGED')
        expect(actor.updated_at_tick).toBe(0)
        const item = ItemPhysicalPlacementSchema.parse({
            item_id: 'item_crowbar',
            carrier_type: 'ROOM_SURFACE',
            carrier_id: 'loc_culvert',
            room_id: 'loc_culvert',
        })
        expect(item.is_secured).toBe(true)
        expect(item.updated_at_tick).toBe(0)
    })

    it('enforces strict Zod validation rejecting un-schemaed keys on actor placement', () => {
        const invalidActor = {
            actor_id: 'char_silas',
            room_id: 'loc_culvert',
            scale: 'STAGED',
            rogue_key: 'UNAUTHORIZED_DATA',
        }
        expect(() => ActorPhysicalPlacementSchema.parse(invalidActor)).toThrow()
    })

    it('requires transit_edge_id when actor is IN_TRANSIT', () => {
        expect(() =>
            ActorPhysicalPlacementSchema.parse({
                actor_id: 'char_silas',
                room_id: 'loc_culvert',
                scale: 'IN_TRANSIT',
            }),
        ).toThrow(/TRANSIT_EDGE_REQUIRED/)
        expect(
            ActorPhysicalPlacementSchema.parse({
                actor_id: 'char_silas',
                room_id: 'loc_culvert',
                scale: 'IN_TRANSIT',
                transit_edge_id: 'edge_culvert_pump',
            }).scale,
        ).toBe('IN_TRANSIT')
    })

    it('enforces conservation of mass across world physical manifest', () => {
        const validManifest: WorldPhysicalManifest = {
            tick: 10,
            actors: {
                char_silas: {
                    actor_id: 'char_silas',
                    room_id: 'loc_culvert',
                    scale: 'STAGED',
                    updated_at_tick: 10,
                },
            },
            items: {
                item_iron_wrench: {
                    item_id: 'item_iron_wrench',
                    carrier_type: 'ACTOR_HELD',
                    carrier_id: 'char_silas',
                    room_id: 'loc_culvert',
                    is_secured: true,
                    updated_at_tick: 10,
                },
            },
        }
        expect(() =>
            WorldPhysicalManifestSchema.parse(validManifest),
        ).not.toThrow()

        const invalidManifest: WorldPhysicalManifest = {
            tick: 10,
            actors: {
                char_silas: {
                    actor_id: 'char_silas',
                    room_id: 'loc_culvert',
                    scale: 'STAGED',
                    updated_at_tick: 10,
                },
            },
            items: {
                item_iron_wrench: {
                    item_id: 'item_iron_wrench',
                    carrier_type: 'ACTOR_HELD',
                    carrier_id: 'char_silas',
                    room_id: 'loc_pump_house',
                    is_secured: true,
                    updated_at_tick: 10,
                },
            },
        }
        expect(() =>
            WorldPhysicalManifestSchema.parse(invalidManifest),
        ).toThrow(/MASS_CONSERVATION_DESYNC/)
    })

    it('halts closed on topological co-presence violation in O(1) time', () => {
        const manifest: WorldPhysicalManifest = {
            tick: 1,
            actors: {
                char_bog: {
                    actor_id: 'char_bog',
                    room_id: 'loc_culvert',
                    scale: 'STAGED',
                    updated_at_tick: 1,
                },
                char_wart: {
                    actor_id: 'char_wart',
                    room_id: 'loc_pump_house',
                    scale: 'STAGED',
                    updated_at_tick: 1,
                },
            },
            items: {
                item_brass_siphon: {
                    item_id: 'item_brass_siphon',
                    carrier_type: 'ROOM_SURFACE',
                    carrier_id: 'loc_pump_house',
                    room_id: 'loc_pump_house',
                    is_secured: true,
                    updated_at_tick: 1,
                },
            },
        }

        const resultItem = SpatialPresenceSolver.evaluateCoPresence(
            manifest,
            'char_bog',
            'item_brass_siphon',
        )
        expect(resultItem.satisfiable).toBe(false)
        expect(resultItem.errorCode).toBe('SPATIAL_CO_PRESENCE_VIOLATION')

        const resultValid = SpatialPresenceSolver.evaluateCoPresence(
            manifest,
            'char_wart',
            'item_brass_siphon',
        )
        expect(resultValid.satisfiable).toBe(true)
        expect(resultValid.actorRoomId).toBe('loc_pump_house')

        const missing = SpatialPresenceSolver.evaluateCoPresence(
            manifest,
            'char_nobody',
            'item_brass_siphon',
        )
        expect(missing.satisfiable).toBe(false)
        expect(missing.errorCode).toBe('ENTITY_NOT_FOUND')
    })

    it('verifies absolute item disjointness across multiple proposals', () => {
        const items = [
            {
                item_id: 'item_knife',
                carrier_type: 'ACTOR_HELD' as const,
                carrier_id: 'char_bog',
                room_id: 'loc_culvert',
                is_secured: true,
                updated_at_tick: 1,
            },
            {
                item_id: 'item_knife',
                carrier_type: 'ACTOR_HELD' as const,
                carrier_id: 'char_spleen',
                room_id: 'loc_culvert',
                is_secured: true,
                updated_at_tick: 1,
            },
        ]

        const disjointness = SpatialPresenceSolver.assertItemDisjointness(items)
        expect(disjointness.valid).toBe(false)
        expect(disjointness.duplicateItemIds).toContain('item_knife')

        const evaluated = SpatialPresenceSolver.evaluateItemDisjointness(items)
        expect(evaluated.valid).toBe(false)
        expect(evaluated.errorCode).toBe('MASS_CONSERVATION_BREACH')
        expect(evaluated.violations[0]?.errorCode).toBe(
            'MASS_CONSERVATION_BREACH',
        )

        const heldVsContainer = SpatialPresenceSolver.evaluateItemDisjointness([
            items[0]!,
            {
                item_id: 'item_knife',
                carrier_type: 'CONTAINER_FIXTURE' as const,
                carrier_id: 'item_chest',
                room_id: 'loc_culvert',
                is_secured: true,
                updated_at_tick: 1,
            },
        ])
        expect(heldVsContainer.valid).toBe(false)
        expect(heldVsContainer.violations[0]?.reason).toMatch(
            /simultaneously held/,
        )
    })

    it('persists and verifies spatial state parity in local SQLite', () => {
        const manifest: WorldPhysicalManifest = {
            tick: 5,
            actors: {
                char_silas: {
                    actor_id: 'char_silas',
                    room_id: 'loc_culvert',
                    scale: 'STAGED',
                    updated_at_tick: 5,
                },
            },
            items: {
                item_crowbar: {
                    item_id: 'item_crowbar',
                    carrier_type: 'ROOM_SURFACE',
                    carrier_id: 'loc_culvert',
                    room_id: 'loc_culvert',
                    is_secured: true,
                    updated_at_tick: 5,
                },
            },
        }

        const synced = SpatialPresenceSolver.verifyLocalSqliteParity(
            db,
            manifest,
        )
        expect(synced).toBe(true)

        const actorRow = db
            .prepare(
                "SELECT actor_id, room_id FROM spatial_actors WHERE actor_id = 'char_silas'",
            )
            .get() as { actor_id: string; room_id: string }
        expect(actorRow.actor_id).toBe('char_silas')
        expect(actorRow.room_id).toBe('loc_culvert')

        const itemRow = db
            .prepare(
                "SELECT item_id, room_id FROM spatial_items WHERE item_id = 'item_crowbar'",
            )
            .get() as { item_id: string; room_id: string }
        expect(itemRow.item_id).toBe('item_crowbar')
        expect(itemRow.room_id).toBe('loc_culvert')
    })
})
