/**
 * packages/299.lore/26.schema.unit/buz/freeze.buzz.ts
 *
 * Recursive in-memory deepFreeze() immutability guard for 26.schema.unit.
 * Seals V8 heap objects against downstream state mutation at T_0 = $0.00.
 */

/**
 * DeepReadonly type utility for recursive compile-time immutability.
 */
export type DeepReadonly<T> = T extends (infer R)[]
    ? ReadonlyArray<DeepReadonly<R>>
    : T extends Function
      ? T
      : T extends object
        ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
        : T

/**
 * Recursively deep-freezes an object graph to guarantee absolute immutability.
 * Uses Object.getOwnPropertyNames to prevent prototype pollution or inherited escapes.
 *
 * @param obj - Target object, array, or primitive to seal
 * @returns Deeply frozen, read-only reference of the input
 */
export function deepFreeze<T>(obj: T): DeepReadonly<T> {
    // Primitives, null, and undefined cannot and need not be frozen
    if (obj === null || typeof obj !== 'object') {
        return obj as DeepReadonly<T>
    }

    // If already frozen, avoid re-processing
    if (Object.isFrozen(obj)) {
        return obj as DeepReadonly<T>
    }

    // Freeze the current object first to break circular reference cycles
    Object.freeze(obj)

    // Retrieve own property names to prevent inherited property mutation
    const propNames = Object.getOwnPropertyNames(obj)

    for (const name of propNames) {
        const value = (obj as Record<string, unknown>)[name]

        // Recurse into nested objects and arrays if not already sealed
        if (
            value !== null &&
            typeof value === 'object' &&
            !Object.isFrozen(value)
        ) {
            deepFreeze(value)
        }
    }

    return obj as DeepReadonly<T>
}

export default deepFreeze
