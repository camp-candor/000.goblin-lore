import { FactScope } from '../val/scope.val.js'

export type EntityPrefix = 'char_' | 'loc_' | 'item_' | 'law_'

/**
 * Immutable mapping binding each FactScope to its mandatory canonical identifier prefix.
 */
export const SCOPE_PREFIX_MAP: Readonly<Record<FactScope, EntityPrefix>> =
    Object.freeze({
        CHARACTER: 'char_',
        LOCATION: 'loc_',
        LOGISTIC: 'item_',
        LAW: 'law_',
    })

export interface FactScopeBit {
    readonly scope: FactScope
    readonly expectedPrefix: EntityPrefix
    readonly description: string
}

/**
 * Metadata descriptors for TUI display and diagnostic receipts.
 */
export const FACT_SCOPE_DEFINITIONS: Readonly<Record<FactScope, FactScopeBit>> =
    Object.freeze({
        CHARACTER: Object.freeze({
            scope: 'CHARACTER',
            expectedPrefix: 'char_',
            description:
                'Biological, psychological, and relational claims bound to an active character.',
        }),
        LOCATION: Object.freeze({
            scope: 'LOCATION',
            expectedPrefix: 'loc_',
            description:
                'Topological boundaries, spatial cells, and acoustic room properties.',
        }),
        LOGISTIC: Object.freeze({
            scope: 'LOGISTIC',
            expectedPrefix: 'item_',
            description:
                'Mass, durability, and equipment slot occupancy of physical possessions.',
        }),
        LAW: Object.freeze({
            scope: 'LAW',
            expectedPrefix: 'law_',
            description:
                'Universal storyworld axioms, physics constraints, and absolute taboos.',
        }),
    })

/**
 * Resolves the mandatory ID prefix for a given FactScope.
 */
export function getScopePrefix(scope: FactScope): EntityPrefix {
    return SCOPE_PREFIX_MAP[scope]
}

/**
 * Infers the FactScope from an entity ID prefix.
 * Throws an Error if the prefix is unrecognized.
 */
export function inferScopeFromEntityId(entityId: string): FactScope {
    if (entityId.startsWith(SCOPE_PREFIX_MAP.CHARACTER)) return 'CHARACTER'
    if (entityId.startsWith(SCOPE_PREFIX_MAP.LOCATION)) return 'LOCATION'
    if (entityId.startsWith(SCOPE_PREFIX_MAP.LOGISTIC)) return 'LOGISTIC'
    if (entityId.startsWith(SCOPE_PREFIX_MAP.LAW)) return 'LAW'

    throw new Error(
        `[UNKNOWN_ENTITY_PREFIX] Unable to infer FactScope from entity ID: '${entityId}'`,
    )
}
