export type EntityDomainType =
    'character' | 'location' | 'possession' | 'grievance' | 'mystery'

export interface RefusalVectorEntry {
    trigger_condition: string
    mandatory_refusal: string
    unavoidable_cost: string
}

export interface DualRailVoiceSections {
    wantsSurface?: string
    wantsActual?: string
    blindSpot?: string
    voiceNotes?: string
    fewShotLines?: string[]
    refusalVectors?: RefusalVectorEntry[]

    tacticalGeometry?: string
    sensoryAtmosphere?: string
    structuralHazards?: string

    provenanceNotes?: string
    dramaticFunction?: string
}

export interface ByteZeroAuditReceipt {
    valid: boolean
    byteLength: number
    firstFourBytesHex: string
    error?: string
}

export default interface EntityAssembleBit {
    idx: string
    src?: string
    val?: number
    dat?: {
        domain: EntityDomainType
        frontmatter: Record<string, unknown>
        voiceSections: DualRailVoiceSections
    }
    slv?: (result: {
        entBit: {
            idx: string
            val: number
            dat: {
                dossierText: string
                receipt: ByteZeroAuditReceipt
            }
        }
    }) => void
}
