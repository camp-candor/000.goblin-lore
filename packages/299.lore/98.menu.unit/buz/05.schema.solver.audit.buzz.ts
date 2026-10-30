/* eslint-disable */
import { SchemaModel } from '../../26.schema.unit/schema.model'
import { validateEntity } from '../../26.schema.unit/buz/validate.buzz'
import { solveSomaticSAT } from '../../26.schema.unit/buz/somatic-sat.buzz'

export const SCHEMA_SOLVER_MENU_LABEL = '[ 26. SCHEMA & INVARIANTS ]'
export const VALIDATE_MANIFESTS_LABEL = '[ 1. Validate Entity Manifests ]'
export const RUN_SOLVER_SAT_LABEL = '[ 2. Run Somatic SAT Solver ]'
export const SCHEMA_SOLVER_BACK_LABEL = '[ BACK ]'

export const TELEMETRY_SCHEMA_AUDIT =
    '>> [SCHEMA:AUDIT] Streaming entity manifests through 26.schema.unit router...'
export const TELEMETRY_SCHEMA_OK =
    '>> [SCHEMA:OK] Router fails closed; valid manifest frozen into validatedEntities. Status code: 0.'
export const TELEMETRY_SAT_AUDIT =
    '>> [SAT:AUDIT] Solving hand-capacity satisfiability matrix...'
export const TELEMETRY_SAT_OK =
    '>> [SAT:OK] Overload halted at T_0; valid loadouts admitted. Status code: 0.'

const STE: any = { hunt: async () => ({}) }

const VALID_POSSESSION = {
    schema_version: 1,
    id: 'item_silver_spoon',
    name: 'Silver Spoon',
    owner_id: 'char_bog',
    weight_class: 'WEIGHT',
    mass_g: 300,
    occupies_hands: 1,
    contested_by: [],
    linked_grievances: [],
}

/**
 * Runs the REAL Phase 5 entity manifest checks against the live
 * 26.schema.unit validateEntity router. Returns the exact 7-bit ASCII
 * telemetry lines on success; throws a [SCHEMA:FAILED] error on any breach.
 */
export const runEntityManifestAudit = async (): Promise<string[]> => {
    const model = new SchemaModel()

    const validBal: any = {
        idx: 'menu_manifest_valid',
        src: 'possession',
        dat: VALID_POSSESSION,
    }
    await validateEntity(model, validBal, STE)
    if (validBal.val !== 0) {
        throw new Error(
            '[SCHEMA:FAILED] Compliant possession manifest rejected by schema router.',
        )
    }
    if (!Object.isFrozen(model.validatedEntities['item_silver_spoon'])) {
        throw new Error(
            '[SCHEMA:FAILED] Validated manifest not deep-frozen in validatedEntities.',
        )
    }

    const invalidBal: any = {
        idx: 'menu_manifest_invalid',
        src: 'possession',
        dat: {
            ...VALID_POSSESSION,
            id: 'item_broken',
            weight_class: 'INVALID_CLASS',
        },
    }
    await validateEntity(model, invalidBal, STE)
    if (
        invalidBal.val !== -1 ||
        !String(invalidBal.lst?.[0] || '').includes('[weight_class]')
    ) {
        throw new Error(
            '[SCHEMA:FAILED] Illegal weight_class enum escaped the schema router.',
        )
    }
    if ('item_broken' in model.validatedEntities) {
        throw new Error(
            '[SCHEMA:FAILED] Unvalidated manifest leaked into validatedEntities.',
        )
    }

    const unknownBal: any = {
        idx: 'menu_manifest_unknown',
        src: 'mythical_creature',
        dat: { id: 'beast_01' },
    }
    await validateEntity(model, unknownBal, STE)
    if (
        unknownBal.val !== -1 ||
        !String(unknownBal.lst?.[0] || '').includes('UNKNOWN_ENTITY_SCHEMA')
    ) {
        throw new Error(
            '[SCHEMA:FAILED] Unknown entity discriminator escaped fail-closed routing.',
        )
    }

    return [
        TELEMETRY_SCHEMA_AUDIT,
        '>> [SCHEMA:STREAM] possession:item_silver_spoon VALID | possession:item_broken REJECT[weight_class] | mythical_creature REJECT[UNKNOWN_ENTITY_SCHEMA]',
        TELEMETRY_SCHEMA_OK,
    ]
}

/**
 * Runs the REAL Phase 5 somatic checks against the live 26.schema.unit
 * solveSomaticSAT solver. Returns the exact 7-bit ASCII telemetry lines on
 * success; throws a [SAT:FAILED] error on any breach.
 */
export const runSomaticSolverAudit = async (): Promise<string[]> => {
    const model = new SchemaModel()

    const passBal: any = {
        idx: 'menu_sat_pass',
        dat: {
            character_id: 'char_bog',
            arms_available: 2,
            impairment_penalties: 0,
            held_primary: { id: 'item_spoon', occupies_hands: 1 },
            held_secondary: { id: 'item_thimble', occupies_hands: 1 },
        },
    }
    await solveSomaticSAT(model, passBal, STE)
    if (passBal.val !== 0) {
        throw new Error(
            '[SAT:FAILED] Valid 2-arm two-item loadout rejected by somatic solver.',
        )
    }

    const failBal: any = {
        idx: 'menu_sat_fail',
        dat: {
            character_id: 'char_wart',
            arms_available: 2,
            impairment_penalties: 1,
            held_primary: { id: 'item_spoon', occupies_hands: 1 },
            held_secondary: { id: 'item_thimble', occupies_hands: 1 },
        },
    }
    await solveSomaticSAT(model, failBal, STE)
    if (
        failBal.val !== -1 ||
        !String(failBal.lst?.[0] || '').includes('[SOMATIC_OVERLOAD]')
    ) {
        throw new Error(
            '[SAT:FAILED] Impaired arm over-allocation escaped [SOMATIC_OVERLOAD].',
        )
    }

    return [
        TELEMETRY_SAT_AUDIT,
        '>> [SAT:MATRIX] char_bog arms=2 impaired=0 required=2 SAT | char_wart arms=2 impaired=1 required=2 UNSAT[SOMATIC_OVERLOAD]',
        TELEMETRY_SAT_OK,
    ]
}
