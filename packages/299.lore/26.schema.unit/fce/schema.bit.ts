/**
 * packages/299.lore/26.schema.unit/fce/schema.bit.ts
 *
 * Ephemeral communication bit contract for 26.schema.unit.
 * Governs transient action envelopes across the simulation state bus.
 */

export default interface SchemaBit {
    /**
     * Monotonic sequential index or discrete message address identifier.
     */
    idx: string

    /**
     * Entity type discriminator: 'character' | 'location' | 'possession' | 'grievance' | 'mystery'
     */
    src?: string

    /**
     * Exit status code: 0 = PASS (Valid), -1 = FAIL (Invariant Violation)
     */
    val?: number

    /**
     * Staged untrusted payload buffer (raw frontmatter, entity data, or SAT query parameters)
     */
    dat?: any

    /**
     * Array of formatted diagnostic error traces or failure paths (e.g. ['[somatic.arms_available]: Value must be <= 4'])
     */
    lst?: string[]

    /**
     * Asynchronous resolver callback for reactive unit dispatch coordination
     */
    slv?: (result: { schBit: SchemaBit }) => void
}
