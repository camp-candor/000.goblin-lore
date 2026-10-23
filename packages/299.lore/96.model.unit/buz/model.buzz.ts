import { ModelModel, Model } from '../model.model.js'
import ModelBit, {
    FactNodeBit,
    DeepReadonly,
    FactRegistryStatsBit,
    RegistryOperationResult,
} from '../fce/model.bit.js'
import ModBit from '../fce/modBit.js'

import State from '../../99.core/state.js'

import * as ActCol from '../../97.collect.unit/collect.action.js'
import * as ActMod from '../../96.model.unit/model.action.js'
import { FactScope } from '../../38.types.unit/val/scope.val.js'
import { AuthorityLevel } from '../../38.types.unit/val/authority.val.js'
import { StoredFactNodeSchema } from '../val/model.val.js'

var bit, dat

export const initModel = (cpy: ModelModel, bal: ModelBit, ste: State) => {
    return cpy
}

export const updateModel = (cpy: ModelModel, bal: ModelBit, ste: State) => {
    bal.slv({ modBit: { idx: 'update-model' } })
    return cpy
}

export const readModel = async (cpy: ModelModel, bal: ModelBit, ste: State) => {
    if (bal.idx == null) bal.idx = 'mod00'

    bit = await ste.hunt(ActCol.READ_COLLECT, {
        idx: bal.idx,
        bit: ActMod.CREATE_MODEL,
    })

    bal.slv({ modBit: { idx: 'read-model', dat: bit.clcBit.dat } })
    return cpy
}

export const writeModel = async (
    cpy: ModelModel,
    bal: ModelBit,
    ste: State,
) => {
    if (bal.dat == null) bal.dat = {}

    bit = await ste.hunt(ActCol.WRITE_COLLECT, {
        idx: bal.idx,
        dat: bal.dat,
        bit: ActMod.CREATE_MODEL,
    })
    dat = bit.clcBit.dat
    bal.slv({ modBit: { idx: 'write-model', dat } })
    return cpy
}

export const removeModel = async (
    cpy: ModelModel,
    bal: ModelBit,
    ste: State,
) => {
    bit = await ste.hunt(ActCol.REMOVE_COLLECT, {
        idx: bal.idx,
        bit: ActMod.DELETE_MODEL,
    })

    bal.slv({ modBit: { idx: 'remove-model', dat: bit.clcBit.dat } })
    return cpy
}

export const deleteModel = (cpy: ModelModel, bal: ModelBit, ste: State) => {
    bal.slv({ modBit: { idx: 'delete-model' } })
    return cpy
}

export const createModel = (cpy: ModelModel, bal: ModelBit, ste: State) => {
    if (bal.dat == null) bal.dat = {}
    var modBit: ModBit = { idx: bal.idx, src: bal.dat.src }

    bal.slv({ modBit: { idx: 'create-model', dat: modBit } })
    return cpy
}

export const listModel = async (cpy: ModelModel, bal: ModelBit, ste: State) => {
    bit = await ste.hunt(ActCol.LIST_COLLECT, {
        val: bal.val,
        bit: ActMod.CREATE_MODEL,
    })
    bal.slv({ modBit: { idx: 'list-model', lst: bit.clcBit.lst } })
    return cpy
}

/**
 * Recursively applies Object.freeze across an object tree.
 * Prevents in-memory property mutations across asynchronous runtime scopes.
 */
const FROZEN_PROXY = Symbol('FROZEN_PROXY')

export function deepFreeze<T>(obj: T): DeepReadonly<T> {
    if (obj === null || typeof obj !== 'object') {
        return obj as DeepReadonly<T>
    }

    if ((obj as any)[FROZEN_PROXY]) {
        return obj as DeepReadonly<T>
    }

    for (const key of Object.getOwnPropertyNames(obj)) {
        const prop = (obj as any)[key]
        if (
            prop !== null &&
            (typeof prop === 'object' || typeof prop === 'function')
        ) {
            ;(obj as any)[key] = deepFreeze(prop)
        }
    }

    Object.freeze(obj)

    return new Proxy(obj, {
        get(target, prop, receiver) {
            if (prop === FROZEN_PROXY) return true
            return Reflect.get(target, prop, receiver)
        },
        set(_target, prop) {
            throw new TypeError(
                `Cannot assign to read only property '${String(prop)}'`,
            )
        },
        defineProperty(_target, prop) {
            throw new TypeError(`Cannot define property '${String(prop)}'`)
        },
        deleteProperty(_target, prop) {
            throw new TypeError(`Cannot delete property '${String(prop)}'`)
        },
    }) as DeepReadonly<T>
}

/**
 * Validates, deep-freezes, and stores a fact node in the in-memory registry.
 */
export function registerFactNode(candidate: unknown): RegistryOperationResult {
    const parseResult = StoredFactNodeSchema.safeParse(candidate)
    if (!parseResult.success) {
        const errorMsg = parseResult.error.errors
            .map((e) => e.message)
            .join('; ')
        recordSchemaError(errorMsg)
        return {
            valid: false,
            errorCode: 'SCHEMA_VALIDATION_ERROR',
            factId:
                typeof candidate === 'object' &&
                candidate !== null &&
                'id' in candidate
                    ? String((candidate as any).id)
                    : 'UNKNOWN',
            message: `Failed schema validation: ${errorMsg}`,
        }
    }

    const fact = parseResult.data
    const frozenFact = deepFreeze(fact)

    // Store in primary ID map
    Model.facts.set(frozenFact.id, frozenFact)

    // Index in scope map
    const scopeSet = Model.factsByScope.get(frozenFact.scope)
    if (scopeSet) {
        scopeSet.add(frozenFact.id)
    }

    // Index in authority map
    const authoritySet = Model.factsByAuthority.get(frozenFact.authority_level)
    if (authoritySet) {
        authoritySet.add(frozenFact.id)
    }

    return {
        valid: true,
        factId: frozenFact.id,
        telemetryMessage: `Fact '${frozenFact.id}' (v${frozenFact.version}) registered and deep-frozen.`,
    }
}

/**
 * Retrieves a deep-frozen fact node by ID with O(1) efficiency.
 */
export function getFactNode(id: string): DeepReadonly<FactNodeBit> | undefined {
    return Model.facts.get(id)
}

/**
 * Checks whether a fact node exists in the registry.
 */
export function hasFactNode(id: string): boolean {
    return Model.facts.has(id)
}

/**
 * Retrieves all registered fact nodes matching a given scope.
 */
export function getFactsByScope(
    scope: FactScope,
): readonly DeepReadonly<FactNodeBit>[] {
    const ids = Model.factsByScope.get(scope)
    if (!ids) return []
    const results: DeepReadonly<FactNodeBit>[] = []
    for (const id of ids) {
        const node = Model.facts.get(id)
        if (node) results.push(node)
    }
    return deepFreeze(results)
}

/**
 * Retrieves all registered fact nodes matching a given authority level.
 */
export function getFactsByAuthority(
    level: AuthorityLevel,
): readonly DeepReadonly<FactNodeBit>[] {
    const ids = Model.factsByAuthority.get(level)
    if (!ids) return []
    const results: DeepReadonly<FactNodeBit>[] = []
    for (const id of ids) {
        const node = Model.facts.get(id)
        if (node) results.push(node)
    }
    return deepFreeze(results)
}

/**
 * Appends a validation error to the in-memory error audit log.
 */
export function recordSchemaError(errorMessage: string): void {
    Model.lastSchemaErrors.push(errorMessage)
    if (Model.lastSchemaErrors.length > 100) {
        Model.lastSchemaErrors.shift()
    }
}

/**
 * Returns the recent schema validation error log.
 */
export function getLastSchemaErrors(): readonly string[] {
    return deepFreeze([...Model.lastSchemaErrors])
}

/**
 * Computes live metrics across the in-memory fact store.
 */
export function getRegistryStats(): FactRegistryStatsBit {
    const scopeCounts: Record<FactScope, number> = {
        CHARACTER: Model.factsByScope.get('CHARACTER')?.size || 0,
        LOCATION: Model.factsByScope.get('LOCATION')?.size || 0,
        LOGISTIC: Model.factsByScope.get('LOGISTIC')?.size || 0,
        LAW: Model.factsByScope.get('LAW')?.size || 0,
    }

    const authorityCounts: Record<AuthorityLevel, number> = {
        AXIOM: Model.factsByAuthority.get('AXIOM')?.size || 0,
        CANON: Model.factsByAuthority.get('CANON')?.size || 0,
        EVENT: Model.factsByAuthority.get('EVENT')?.size || 0,
        RUNTIME_STATE: Model.factsByAuthority.get('RUNTIME_STATE')?.size || 0,
        PROJECTION: Model.factsByAuthority.get('PROJECTION')?.size || 0,
        SPECULATION: Model.factsByAuthority.get('SPECULATION')?.size || 0,
    }

    const standingCounts: Record<
        'ACTIVE_ENDORSED' | 'FLAGGED_FOR_REVIEW' | 'DEPRECATED_ARCHIVED',
        number
    > = {
        ACTIVE_ENDORSED: 0,
        FLAGGED_FOR_REVIEW: 0,
        DEPRECATED_ARCHIVED: 0,
    }

    for (const fact of Model.facts.values()) {
        standingCounts[fact.standing]++
    }

    return deepFreeze({
        totalFacts: Model.facts.size,
        scopeCounts,
        authorityCounts,
        standingCounts,
        errorLogCount: Model.lastSchemaErrors.length,
    })
}

/**
 * Clears the registry store and resets indices.
 */
export function clearRegistry(): void {
    Model.reset()
}

/**
 * Hard fail-closed assertion for registering a fact node.
 * Throws an Error immediately at Stage T0 ($0.00) if validation fails.
 */
export function assertRegisterFactNode(
    candidate: unknown,
): DeepReadonly<FactNodeBit> {
    const result = registerFactNode(candidate)
    if (!result.valid) {
        throw new Error(
            `[REGISTRY_STORE_BREACH] ${result.errorCode}: ${result.message}`,
        )
    }
    return Model.facts.get(result.factId)!
}
