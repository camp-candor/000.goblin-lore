import type Schema from './fce/schema.interface'
import type SchemaBit from './fce/schema.bit'

export class SchemaModel implements Schema {
    idx: string = '26.schema'
    schemaBits: Record<string, SchemaBit> = {}
    validatedEntities: Record<string, any> = {}
    lastValidationReport?: {
        status: number
        errors: string[]
        validatedCount: number
    }
}
