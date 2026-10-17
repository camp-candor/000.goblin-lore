import { z } from 'zod'

// ---------------------------------------------------------------------------
// 1. Axial Hex Coordinates (Pointy-Top / Doubled Integer Lattice)
// ---------------------------------------------------------------------------
export const AxialCoordinateSchema = z
    .object({
        q: z.number().int(),
        r: z.number().int(),
        s: z.number().int(),
    })
    .strict()
    .refine((coord) => coord.q + coord.r + coord.s === 0, {
        message:
            'AXIAL_COORDINATE_CUBE_INVARIANT_BREACH: q + r + s must equal 0.',
    })

export type AxialCoordinate = z.infer<typeof AxialCoordinateSchema>

// ---------------------------------------------------------------------------
// 2. Actor Physical Placement Schema
// ---------------------------------------------------------------------------
export const ActorScaleEnum = z.enum(['STAGED', 'IN_TRANSIT'])

export const ActorPhysicalPlacementSchema = z
    .object({
        actor_id: z.string().regex(/^char_[a-z0-9_]+$/),
        room_id: z.string().regex(/^loc_[a-z0-9_]+$/),
        scale: ActorScaleEnum.default('STAGED'),
        axial_coord: AxialCoordinateSchema.optional(),
        transit_edge_id: z.string().optional(),
        updated_at_tick: z.number().int().min(0).default(0),
    })
    .strict()
    .refine(
        (data) => {
            if (data.scale === 'IN_TRANSIT') {
                return !!data.transit_edge_id
            }
            return true
        },
        {
            message:
                'TRANSIT_EDGE_REQUIRED: Actors IN_TRANSIT must specify transit_edge_id.',
            path: ['transit_edge_id'],
        },
    )

export type ActorPhysicalPlacement = z.infer<
    typeof ActorPhysicalPlacementSchema
>

// ---------------------------------------------------------------------------
// 3. Item Physical Placement Schema (Single Carrier / Conservation of Matter)
// ---------------------------------------------------------------------------
// Canonical carrier types are ROOM_SURFACE, CONTAINER_FIXTURE, ACTOR_HELD,
// ACTOR_WORN and ACTOR_CARRIED. The short forms ROOM, CONTAINER and
// ACTOR_SLOT are accepted as aliases for the same three carrier families
// so checklist-level callers and canonical callers share one schema.
export const ItemCarrierTypeEnum = z.enum([
    'ROOM_SURFACE',
    'CONTAINER_FIXTURE',
    'ACTOR_HELD',
    'ACTOR_WORN',
    'ACTOR_CARRIED',
    'ROOM',
    'CONTAINER',
    'ACTOR_SLOT',
])

export type ItemCarrierType = z.infer<typeof ItemCarrierTypeEnum>

export const ACTOR_CARRIER_TYPES: ReadonlySet<string> = new Set([
    'ACTOR_HELD',
    'ACTOR_WORN',
    'ACTOR_CARRIED',
    'ACTOR_SLOT',
])

export function isActorCarrier(carrierType: string): boolean {
    return ACTOR_CARRIER_TYPES.has(carrierType)
}

export const ItemPhysicalPlacementSchema = z
    .object({
        item_id: z.string().regex(/^item_[a-z0-9_]+$/),
        carrier_type: ItemCarrierTypeEnum,
        carrier_id: z.string().min(1),
        room_id: z.string().regex(/^loc_[a-z0-9_]+$/),
        slot_name: z.string().optional(),
        is_secured: z.boolean().default(true),
        updated_at_tick: z.number().int().min(0).default(0),
    })
    .strict()

export type ItemPhysicalPlacement = z.infer<typeof ItemPhysicalPlacementSchema>

// ---------------------------------------------------------------------------
// 4. World Physical Manifest & Global Disjointness Invariant
// ---------------------------------------------------------------------------
export const WorldPhysicalManifestSchema = z
    .object({
        tick: z.number().int().min(0).default(0),
        actors: z.record(z.string(), ActorPhysicalPlacementSchema).default({}),
        items: z.record(z.string(), ItemPhysicalPlacementSchema).default({}),
    })
    .strict()
    .refine(
        (manifest) => {
            for (const item of Object.values(manifest.items)) {
                if (isActorCarrier(item.carrier_type)) {
                    const actor = manifest.actors[item.carrier_id]
                    if (!actor) {
                        return false
                    }
                    if (actor.room_id !== item.room_id) {
                        return false
                    }
                }
            }
            return true
        },
        {
            message:
                'MASS_CONSERVATION_DESYNC: Carried item room_id does not match carrier actor room_id.',
        },
    )

export type WorldPhysicalManifest = z.infer<typeof WorldPhysicalManifestSchema>
