import type SchemaBit from './schema.bit'

export default interface Schema {
    idx: string
    schemaBits: Record<string, SchemaBit>
    validatedEntities: Record<string, any>
    lastValidationReport?: {
        status: number
        errors: string[]
        validatedCount: number
    }
}
