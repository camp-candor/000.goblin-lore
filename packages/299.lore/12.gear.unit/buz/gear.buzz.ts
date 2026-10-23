import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { GearModel } from '../gear.model'
import GearBit from '../fce/gear.bit'
import State from '../../99.core/state'
import {
    PossessionDossierFrontmatterSchema,
    PossessionDossierFrontmatter,
    ResolveGearPointersInputSchema,
    ResolveGearPointersInput,
} from '../val/gear.val'
import {
    CharacterGearResolutionResultBit,
    ResolvedGearItemRecordBit,
    FleetGearAuditResultBit,
} from '../fce/gear.interface'

/**
 * 7-bit ASCII Telemetry logger helper for Blessed Terminal cns00 widget.
 */
async function emitTelemetry(channel: string, message: string): Promise<void> {
    const lib = (
        globalThis as unknown as {
            LIBRARY?: { hunt: (typ: string, obj: unknown) => Promise<void> }
        }
    ).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        await lib.hunt('[Console action] Update Console', {
            idx: channel,
            src: message,
        })
    }
}

export const initGear = (cpy: GearModel, bal: GearBit, ste: State) => {
    cpy.catalog = {}
    cpy.allocations = {}
    if (bal.slv) {
        bal.slv({ gearBit: { idx: 'init-gear', val: 1 } })
    }
    return cpy
}

export const updateGear = (cpy: GearModel, bal: GearBit, ste: State) => {
    if (bal.slv) {
        bal.slv({ gearBit: { idx: 'update-gear', val: 1 } })
    }
    return cpy
}

/**
 * Loads and indexes all possessions/*.md files for a series from local disk.
 */
export function loadSeriesPossessionsCatalog(
    seriesRootPath: string,
): Record<string, PossessionDossierFrontmatter> {
    const catalog: Record<string, PossessionDossierFrontmatter> = {}
    const possessionsDir = path.join(seriesRootPath, 'possessions')

    if (!fs.existsSync(possessionsDir)) {
        return catalog
    }

    const fileNames = fs
        .readdirSync(possessionsDir)
        .filter((f) => f.endsWith('.md'))

    for (const file of fileNames) {
        const fullPath = path.join(possessionsDir, file)
        const content = fs.readFileSync(fullPath, 'utf8')
        const parsed = matter(content)
        const validated = PossessionDossierFrontmatterSchema.parse(parsed.data)
        catalog[validated.id] = validated
    }

    return catalog
}

/**
 * Resolves item slugs declared in character logistical slots against the catalog.
 * Enforces non-fungible leases, mass basis points, and retirement custody purges.
 */
export function resolveCharacterGearPointers(
    input: ResolveGearPointersInput,
    catalog: Record<string, PossessionDossierFrontmatter>,
): CharacterGearResolutionResultBit {
    const parsed = ResolveGearPointersInputSchema.safeParse(input)
    if (!parsed.success) {
        return {
            success: false,
            character_id: input.character_id ?? 'char_unknown',
            total_mass_grams: 0,
            total_held_hands_bps: 0,
            resolved_items: [],
            missing_item_slugs: [],
            duplicate_item_slugs: [],
            errorCode: 'SCHEMA_VALIDATION_ERROR',
            reason:
                parsed.error.issues[0]?.message ??
                'Invalid gear resolution input',
        }
    }

    const { character_id, is_retired, logistical_slots } = parsed.data

    const resolvedItems: ResolvedGearItemRecordBit[] = []
    const missingItems: string[] = []
    const duplicateItems: string[] = []
    const seenInCharacter = new Set<string>()

    let totalMassGrams = 0
    let totalHeldHandsBps = 0

    const processSlot = (
        itemId: string,
        slot: 'worn' | 'held' | 'carried' | 'cached',
        locId?: string,
    ) => {
        if (seenInCharacter.has(itemId)) {
            duplicateItems.push(itemId)
            return
        }
        seenInCharacter.add(itemId)

        const dossier = catalog[itemId]
        if (!dossier) {
            missingItems.push(itemId)
            return
        }

        totalMassGrams += dossier.logistical.mass_grams
        if (slot === 'held') {
            totalHeldHandsBps += dossier.logistical.occupies_hands_bps
        }

        resolvedItems.push({
            item_id: dossier.id,
            name: dossier.name,
            mass_grams: dossier.logistical.mass_grams,
            occupies_hands_bps: dossier.logistical.occupies_hands_bps,
            weight_class: dossier.logistical.weight_class,
            is_contested: dossier.logistical.is_contested,
            slot_assigned: slot,
            location_id: locId,
        })
    }

    for (const id of logistical_slots.worn) processSlot(id, 'worn')
    for (const id of logistical_slots.held) processSlot(id, 'held')
    for (const id of logistical_slots.carried) processSlot(id, 'carried')
    for (const [locId, items] of Object.entries(logistical_slots.cached)) {
        for (const id of items) processSlot(id, 'cached', locId)
    }

    // Check 1: Retirement Custody Invariant
    if (is_retired && seenInCharacter.size > 0) {
        return {
            success: false,
            character_id,
            total_mass_grams: totalMassGrams,
            total_held_hands_bps: totalHeldHandsBps,
            resolved_items: resolvedItems,
            missing_item_slugs: missingItems,
            duplicate_item_slugs: duplicateItems,
            errorCode: 'DANGLING_RETIRED_CUSTODY_BREACH',
            reason: `Retired character ${character_id} retains custody of ${seenInCharacter.size} item(s). Reassign or drop to location floor.`,
        }
    }

    // Check 2: Duplicate Lease Invariant within character
    if (duplicateItems.length > 0) {
        return {
            success: false,
            character_id,
            total_mass_grams: totalMassGrams,
            total_held_hands_bps: totalHeldHandsBps,
            resolved_items: resolvedItems,
            missing_item_slugs: missingItems,
            duplicate_item_slugs: duplicateItems,
            errorCode: 'DUPLICATE_ITEM_LEASE_BREACH',
            reason: `Character ${character_id} declared item(s) in multiple equip slots: [${duplicateItems.join(', ')}]`,
        }
    }

    // Check 3: Dangling Foreign-Key Pointers
    if (missingItems.length > 0) {
        return {
            success: false,
            character_id,
            total_mass_grams: totalMassGrams,
            total_held_hands_bps: totalHeldHandsBps,
            resolved_items: resolvedItems,
            missing_item_slugs: missingItems,
            duplicate_item_slugs: duplicateItems,
            errorCode: 'DANGLING_POSSESSION_POINTER',
            reason: `Character ${character_id} references non-existent possession slug(s): [${missingItems.join(', ')}]`,
        }
    }

    return {
        success: true,
        character_id,
        total_mass_grams: totalMassGrams,
        total_held_hands_bps: totalHeldHandsBps,
        resolved_items: resolvedItems,
        missing_item_slugs: [],
        duplicate_item_slugs: [],
        errorCode: 'NONE',
    }
}

export const resolveCharacterGearBuzz = async (
    cpy: GearModel,
    bal: GearBit<ResolveGearPointersInput>,
    ste: State,
) => {
    if (!bal.dat) {
        if (bal.slv) bal.slv({ gearBit: { idx: bal.idx, val: 0 } })
        return cpy
    }

    const result = resolveCharacterGearPointers(bal.dat, cpy.catalog)
    cpy.allocations[bal.dat.character_id] = result

    if (!result.success) {
        await emitTelemetry(
            'cns00',
            `:: [GEAR:POINTER_FAIL] Entity ${result.character_id}: ${result.errorCode} -> ${result.reason}`,
        )
    } else {
        await emitTelemetry(
            'cns00',
            `>> [GEAR:RESOLVE_OK] Entity ${result.character_id}: ${result.resolved_items.length} items verified (${result.total_mass_grams}g, ${result.total_held_hands_bps} bps hands) [OK]`,
        )
    }

    if (bal.slv) {
        bal.slv({
            gearBit: { idx: bal.idx, val: result.success ? 1 : 0, dat: result },
        })
    }
    return cpy
}

/**
 * Audits global matter conservation and foreign-key integrity across the fleet.
 */
export function auditFleetGearConservation(
    allocations: Record<string, CharacterGearResolutionResultBit>,
    catalog: Record<string, PossessionDossierFrontmatter>,
): FleetGearAuditResultBit {
    const globalLeaseMap = new Map<string, string>()
    const duplicateLeases: string[] = []
    const danglingPointers: string[] = []
    const ungroundedPossessions: string[] = []

    for (const [charId, alloc] of Object.entries(allocations)) {
        if (!alloc.success && alloc.missing_item_slugs.length > 0) {
            for (const m of alloc.missing_item_slugs) {
                danglingPointers.push(
                    `Character ${charId} points to missing item: ${m}`,
                )
            }
        }

        for (const item of alloc.resolved_items) {
            if (globalLeaseMap.has(item.item_id)) {
                duplicateLeases.push(
                    `Item ${item.item_id} simultaneously leased to ${globalLeaseMap.get(item.item_id)} and ${charId}`,
                )
            } else {
                globalLeaseMap.set(item.item_id, charId)
            }
        }
    }

    for (const [itemId, dossier] of Object.entries(catalog)) {
        if (!dossier.owner && !dossier.location_id) {
            ungroundedPossessions.push(
                `Possession ${itemId} lacks both owner and location_id`,
            )
        }
    }

    const success =
        duplicateLeases.length === 0 &&
        danglingPointers.length === 0 &&
        ungroundedPossessions.length === 0

    return {
        success,
        total_characters_audited: Object.keys(allocations).length,
        total_possessions_indexed: Object.keys(catalog).length,
        duplicate_leases: duplicateLeases,
        ungrounded_possessions: ungroundedPossessions,
        dangling_pointers: danglingPointers,
    }
}

export const auditFleetGearBuzz = async (
    cpy: GearModel,
    bal: GearBit,
    ste: State,
) => {
    const audit = auditFleetGearConservation(cpy.allocations, cpy.catalog)

    if (!audit.success) {
        await emitTelemetry(
            'cns00',
            `:: [FLEET_GEAR:BREACH] Audit failed with ${audit.duplicate_leases.length} duplicate(s), ${audit.dangling_pointers.length} dangling pointer(s)`,
        )
    } else {
        await emitTelemetry(
            'cns00',
            `>> [FLEET_GEAR:PASS] Audited ${audit.total_characters_audited} cast members across ${audit.total_possessions_indexed} cataloged possessions [OK]`,
        )
    }

    if (bal.slv) {
        bal.slv({
            gearBit: { idx: bal.idx, val: audit.success ? 1 : 0, dat: audit },
        })
    }
    return cpy
}

export const registerPossessionDossierBuzz = (
    cpy: GearModel,
    bal: GearBit<PossessionDossierFrontmatter>,
    ste: State,
) => {
    if (bal.dat) {
        const validated = PossessionDossierFrontmatterSchema.parse(bal.dat)
        cpy.catalog[validated.id] = validated
    }
    if (bal.slv) {
        bal.slv({ gearBit: { idx: bal.idx, val: 1 } })
    }
    return cpy
}
