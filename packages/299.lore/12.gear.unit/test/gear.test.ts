import { describe, it, expect } from 'vitest'
import {
    PossessionDossierFrontmatterSchema,
    CanonicalPossessionDossierFrontmatterSchema,
    PossessionDossierFrontmatter,
} from '../val/gear.val'
import {
    resolveCharacterGearPointers,
    auditFleetGearConservation,
} from '../buz/gear.buzz'

describe('12.gear.unit :: Gear Unit Foreign-Key Possession Resolver', () => {
    const sampleCatalog: Record<string, PossessionDossierFrontmatter> = {
        item_iron_knife: {
            id: 'item_iron_knife',
            name: 'Iron Knife',
            type: 'possession',
            owner: 'char_bog',
            logistical: {
                weight_class: 'scrap',
                mass_grams: 150,
                occupies_hands: 1,
                occupies_hands_bps: 10000,
                is_contested: false,
                contested_by: [],
                linked_grievances: [],
            },
            created_at_epoch: 100,
        },
        item_tallow_candle: {
            id: 'item_tallow_candle',
            name: 'Tallow Candle',
            type: 'possession',
            location_id: 'loc_warm_pipe',
            logistical: {
                weight_class: 'negligible',
                mass_grams: 45,
                occupies_hands: 1,
                occupies_hands_bps: 10000,
                is_contested: true,
                contested_by: ['char_wart'],
                linked_grievances: ['grv_fuel_siphon_theft'],
            },
            created_at_epoch: 100,
        },
    }

    it('parses valid possession frontmatter with custody grounding', () => {
        const raw = {
            id: 'item_copper_flange',
            name: 'Copper Flange',
            type: 'possession',
            owner: 'char_bog',
            logistical: {
                weight_class: 'scrap',
                mass_grams: 250,
                occupies_hands: 1,
                occupies_hands_bps: 10000,
                is_contested: false,
                contested_by: [],
                linked_grievances: [],
            },
            created_at_epoch: 100,
        }
        const parsed = CanonicalPossessionDossierFrontmatterSchema.parse(raw)
        expect(parsed.id).toBe('item_copper_flange')
        expect(parsed.logistical.mass_grams).toBe(250)
    })

    it('rejects an ungrounded possession lacking both owner and location_id at T_0', () => {
        const ungrounded = {
            id: 'item_lost_bolt',
            name: 'Lost Bolt',
            type: 'possession',
            logistical: {
                weight_class: 'negligible',
                mass_grams: 10,
                occupies_hands: 1,
                occupies_hands_bps: 10000,
                is_contested: false,
                contested_by: [],
                linked_grievances: [],
            },
            created_at_epoch: 100,
        }
        expect(() =>
            PossessionDossierFrontmatterSchema.parse(ungrounded),
        ).toThrow(/UNGROUNDED_POSSESSION_BREACH/)
    })

    it('resolves valid character equipment pointers and computes mass/hand basis points', () => {
        const resolution = resolveCharacterGearPointers(
            {
                series_slug: 'under-the-floorboards',
                character_id: 'char_bog',
                character_name: 'Bog',
                is_retired: false,
                logistical_slots: {
                    worn: [],
                    held: ['item_iron_knife'],
                    carried: ['item_tallow_candle'],
                    cached: {},
                },
            },
            sampleCatalog,
        )

        expect(resolution.success).toBe(true)
        expect(resolution.errorCode).toBe('NONE')
        expect(resolution.total_mass_grams).toBe(195)
        expect(resolution.total_held_hands_bps).toBe(10000)
        expect(resolution.resolved_items).toHaveLength(2)
    })

    it('fails closed when a character points to a non-existent possession slug', () => {
        const resolution = resolveCharacterGearPointers(
            {
                series_slug: 'under-the-floorboards',
                character_id: 'char_bog',
                character_name: 'Bog',
                is_retired: false,
                logistical_slots: {
                    worn: [],
                    held: ['item_ghost_blade'],
                    carried: [],
                    cached: {},
                },
            },
            sampleCatalog,
        )

        expect(resolution.success).toBe(false)
        expect(resolution.errorCode).toBe('DANGLING_POSSESSION_POINTER')
        expect(resolution.missing_item_slugs).toContain('item_ghost_blade')
    })

    it('fails closed when a character declares an item in multiple slots simultaneously', () => {
        const resolution = resolveCharacterGearPointers(
            {
                series_slug: 'under-the-floorboards',
                character_id: 'char_bog',
                character_name: 'Bog',
                is_retired: false,
                logistical_slots: {
                    worn: ['item_iron_knife'],
                    held: ['item_iron_knife'],
                    carried: [],
                    cached: {},
                },
            },
            sampleCatalog,
        )

        expect(resolution.success).toBe(false)
        expect(resolution.errorCode).toBe('DUPLICATE_ITEM_LEASE_BREACH')
        expect(resolution.duplicate_item_slugs).toContain('item_iron_knife')
    })

    it('fails closed if a retired character retains item custody without reassigning', () => {
        const resolution = resolveCharacterGearPointers(
            {
                series_slug: 'under-the-floorboards',
                character_id: 'char_departed_goblin',
                character_name: 'Departed Goblin',
                is_retired: true,
                logistical_slots: {
                    worn: [],
                    held: ['item_iron_knife'],
                    carried: [],
                    cached: {},
                },
            },
            sampleCatalog,
        )

        expect(resolution.success).toBe(false)
        expect(resolution.errorCode).toBe('DANGLING_RETIRED_CUSTODY_BREACH')
    })

    it('audits global matter conservation across characters and catches cross-entity duplicate leases', () => {
        const validAllocations = {
            char_bog: resolveCharacterGearPointers(
                {
                    series_slug: 'test',
                    character_id: 'char_bog',
                    character_name: 'Bog',
                    is_retired: false,
                    logistical_slots: {
                        worn: [],
                        held: ['item_iron_knife'],
                        carried: [],
                        cached: {},
                    },
                },
                sampleCatalog,
            ),
            char_wart: resolveCharacterGearPointers(
                {
                    series_slug: 'test',
                    character_id: 'char_wart',
                    character_name: 'Wart',
                    is_retired: false,
                    logistical_slots: {
                        worn: [],
                        held: ['item_tallow_candle'],
                        carried: [],
                        cached: {},
                    },
                },
                sampleCatalog,
            ),
        }

        const auditPass = auditFleetGearConservation(
            validAllocations,
            sampleCatalog,
        )
        expect(auditPass.success).toBe(true)
        expect(auditPass.duplicate_leases).toHaveLength(0)

        // Inject cross-entity duplicate lease
        const duplicateAllocations = {
            char_bog: resolveCharacterGearPointers(
                {
                    series_slug: 'test',
                    character_id: 'char_bog',
                    character_name: 'Bog',
                    is_retired: false,
                    logistical_slots: {
                        worn: [],
                        held: ['item_iron_knife'],
                        carried: [],
                        cached: {},
                    },
                },
                sampleCatalog,
            ),
            char_wart: resolveCharacterGearPointers(
                {
                    series_slug: 'test',
                    character_id: 'char_wart',
                    character_name: 'Wart',
                    is_retired: false,
                    logistical_slots: {
                        worn: [],
                        held: ['item_iron_knife'],
                        carried: [],
                        cached: {},
                    },
                },
                sampleCatalog,
            ),
        }

        const auditFail = auditFleetGearConservation(
            duplicateAllocations,
            sampleCatalog,
        )
        expect(auditFail.success).toBe(false)
        expect(auditFail.duplicate_leases).toHaveLength(1)
        expect(auditFail.duplicate_leases[0]).toContain('simultaneously leased')
    })
})
