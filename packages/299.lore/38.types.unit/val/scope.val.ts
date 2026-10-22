import { z } from 'zod'

/**
 * Closed Ontological Fact Scope Enumeration.
 * Strictly partitions all canonical propositions into four legislative domains:
 * - CHARACTER: Somatic capabilities, psychological profiles, and personal agency.
 * - LOCATION: Spatial rooms, topological connectivity, and environmental registers.
 * - LOGISTIC: Physical items, gear conservation, mass, and equipment slots.
 * - LAW: Universal storyworld axioms, alethic physics, and system-wide constraints.
 */
export const FactScopeEnum = z.enum([
    'CHARACTER',
    'LOCATION',
    'LOGISTIC',
    'LAW',
])

export type FactScope = z.infer<typeof FactScopeEnum>

/**
 * Array of all valid FactScope string literals for runtime iteration and guards.
 */
export const VALID_FACT_SCOPES: readonly FactScope[] = Object.freeze([
    'CHARACTER',
    'LOCATION',
    'LOGISTIC',
    'LAW',
] as const)

/**
 * Pure type-guard checking whether an arbitrary string conforms to FactScope.
 */
export function isFactScope(value: unknown): value is FactScope {
    return (
        typeof value === 'string' &&
        VALID_FACT_SCOPES.includes(value as FactScope)
    )
}

/**
 * Synchronously validates whether a candidate is a valid FactScope.
 * Throws ZodError if invalid.
 */
export function validateFactScope(rawScope: unknown): FactScope {
    return FactScopeEnum.parse(rawScope)
}
