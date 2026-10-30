export default interface SchemaBit {
    idx: string
    src?: string // Entity type: 'character' | 'location' | 'possession' | 'grievance' | 'mystery'
    val?: number // Status integer: 0 = OK, -1 = Invariant Violation / Error
    dat?: any // Payload containing entity data or SAT parameters
    lst?: string[] // Array of validation error messages or diagnostic traces
    slv?: (result: { schBit: SchemaBit }) => void // Async resolver callback
}
