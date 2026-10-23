import {
    DeepReadonly,
    FactNodeBit,
    RegistryOperationResult,
    FactRegistryStatsBit,
} from '../fce/model.bit.js'
import {
    registerFactNode,
    assertRegisterFactNode,
    getFactNode,
    getRegistryStats,
    clearRegistry,
} from '../buz/model.buzz.js'

export const ModelActions = {
    REGISTER_FACT: 'model/register-fact',
    ASSERT_FACT: 'model/assert-fact',
    GET_FACT: 'model/get-fact',
    GET_STATS: 'model/get-stats',
    CLEAR_REGISTRY: 'model/clear-registry',
} as const

export function registerFactAction(
    candidate: unknown,
): RegistryOperationResult {
    return registerFactNode(candidate)
}

export function assertFactAction(
    candidate: unknown,
): DeepReadonly<FactNodeBit> {
    return assertRegisterFactNode(candidate)
}

export function getFactAction(
    id: string,
): DeepReadonly<FactNodeBit> | undefined {
    return getFactNode(id)
}

export function getStatsAction(): FactRegistryStatsBit {
    return getRegistryStats()
}

export function clearRegistryAction(): void {
    clearRegistry()
}
