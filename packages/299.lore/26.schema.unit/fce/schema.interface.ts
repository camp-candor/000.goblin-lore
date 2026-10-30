/**
 * packages/299.lore/26.schema.unit/fce/schema.interface.ts
 *
 * Persistent in-memory model interface for 26.schema.unit.
 * Holds validated entity store, historical bit index, and audit diagnostics.
 */

import type SchemaBit from './schema.bit'

export interface ValidationReport {
    status: number
    errors: string[]
    validatedCount: number
}

export default interface Schema {
    /**
     * Fixed unit identifier anchor (default: '26.schema')
     */
    idx: string

    /**
     * Historical execution bit cache indexed by bit idx
     */
    schemaBits: Record<string, SchemaBit>

    /**
     * In-memory store of certified, deep-frozen canonical entity records indexed by entity identifier
     */
    validatedEntities: Record<string, any>

    /**
     * Telemetry snapshot from the latest compilation or verification run
     */
    lastValidationReport?: ValidationReport
}
