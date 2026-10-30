import { z } from 'zod'
import type State from '../../99.core/state'
import type SchemaBit from '../fce/schema.bit'
import type { SchemaModel } from '../schema.model'
import { deepFreeze } from './freeze.buzz'

import { CharacterSchema } from '../../02.character.unit/fce/character.schema'
import { LocationSchema } from '../../01.location.unit/fce/spatial.schema'
import { PossessionSchema } from '../../15.item.unit/fce/possession.schema'
import { GrievanceSchema } from '../../13.grievance.unit/fce/grievance.schema'
import { UnresolvedMysterySchema } from '../../41.canon.unit/fce/unresolved.schema'

export const SCHEMA_ROUTER: Record<string, z.ZodTypeAny> = {
    character: CharacterSchema,
    location: LocationSchema,
    possession: PossessionSchema,
    grievance: GrievanceSchema,
    mystery: UnresolvedMysterySchema,
}

/**
 * Validates arbitrary entity payloads against the authoritative Pure Zod Meta-Ontology.
 */
export const validateEntity = async (
    cpy: SchemaModel,
    bal: SchemaBit,
    _ste: State,
): Promise<SchemaModel> => {
    const entityType = bal.src || ''
    const schema = SCHEMA_ROUTER[entityType]

    if (!schema) {
        const errorMsg = `UNKNOWN_ENTITY_SCHEMA: No registered schema found for entity type '${entityType}'`
        bal.val = -1
        bal.lst = [errorMsg]
        if (bal.slv) {
            bal.slv({
                schBit: {
                    idx: bal.idx,
                    src: entityType,
                    val: -1,
                    lst: bal.lst,
                },
            })
        }
        return cpy
    }

    const parseResult = schema.safeParse(bal.dat)

    if (!parseResult.success) {
        const formattedErrors = parseResult.error.issues.map(
            (issue) => `[${issue.path.join('.')}]: ${issue.message}`,
        )

        bal.val = -1
        bal.lst = formattedErrors

        cpy.lastValidationReport = {
            status: -1,
            errors: formattedErrors,
            validatedCount: Object.keys(cpy.validatedEntities).length,
        }

        if (bal.slv) {
            bal.slv({
                schBit: {
                    idx: bal.idx,
                    src: entityType,
                    val: -1,
                    lst: formattedErrors,
                },
            })
        }
        return cpy
    }

    const immutableEntity = deepFreeze(parseResult.data)
    const entityId =
        (immutableEntity as any).id ||
        (immutableEntity as any).topic_id ||
        bal.idx

    cpy.validatedEntities[entityId] = immutableEntity
    cpy.lastValidationReport = {
        status: 0,
        errors: [],
        validatedCount: Object.keys(cpy.validatedEntities).length,
    }

    bal.val = 0
    bal.lst = []

    if (bal.slv) {
        bal.slv({
            schBit: {
                idx: bal.idx,
                src: entityType,
                val: 0,
                dat: immutableEntity,
                lst: [],
            },
        })
    }

    return cpy
}
