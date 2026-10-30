/**
 * Recursively freezes an object and its nested properties to guarantee
 * absolute in-memory immutability inside the V8 heap.
 */
export const deepFreeze = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }

    const propNames = Object.getOwnPropertyNames(obj)

    for (const name of propNames) {
        const value = (obj as any)[name]
        if (value !== null && typeof value === 'object') {
            deepFreeze(value)
        }
    }

    return Object.freeze(obj)
}
