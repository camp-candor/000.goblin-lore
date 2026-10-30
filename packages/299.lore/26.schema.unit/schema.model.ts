/**
 * packages/299.lore/26.schema.unit/schema.model.ts
 *
 * State model container class for 26.schema.unit.
 * Holds persistent in-memory validated entities, historical bits, and audit reports.
 */

import type Schema from './fce/schema.interface'
import type SchemaBit from './fce/schema.bit'
import type { ValidationReport } from './fce/schema.interface'

export class SchemaModel implements Schema {
    /**
     * Fixed unit anchor index.
     */
    idx: string = '26.schema'

    /**
     * Historical bit cache indexed by execution key.
     */
    schemaBits: Record<string, SchemaBit> = {}

    /**
     * In-memory store of certified, deep-frozen canonical entity records.
     */
    validatedEntities: Record<string, any> = {}

    /**
     * Telemetry snapshot from the latest validation or compilation run.
     */
    lastValidationReport?: ValidationReport
}

export default SchemaModel
