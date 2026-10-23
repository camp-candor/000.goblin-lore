/**
 * Bit payload interface for 44.voice.unit
 * Strictly compliant with 299.lore bit conventions.
 */
export default interface VoiceBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}
