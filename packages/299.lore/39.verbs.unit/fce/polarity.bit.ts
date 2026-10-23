import type {
    PolarityScanResult,
    ErrorSignatureVector,
    ParsedActionClause,
} from '../val/polarity.val'

export interface ScanProsePolarityPayload {
    entityId: string
    characterName: string
    characterAliases?: string[]
    markdownProse: string
    bannedKineticVerbs: string[]
}

export interface PolarityBit {
    idx: string
    src?: string
    val?: number
    dat?: ScanProsePolarityPayload | PolarityScanResult
    slv?: (result: {
        polBit: { idx: string; val: number; dat: PolarityScanResult }
    }) => void
}
