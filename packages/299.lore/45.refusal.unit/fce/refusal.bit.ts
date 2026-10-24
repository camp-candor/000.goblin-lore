/**
 * Bit payload interface for 45.refusal.unit
 * Strictly compliant with 299.lore bit conventions.
 */
export default interface RefusalBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}
