/**
 * packages/299.lore/15.item.unit/fce/itemScaffold.bit.ts
 * Data transport contracts for the Interactive Possession Scaffolding Interview.
 * Pure 7-bit clean ASCII.
 */
export interface ItemScaffoldInput {
    seriesSlug?: string
    itemId?: string
    name?: string
    massGrams?: number
    weightClass?: 'scrap' | 'shine' | 'weight' | 'bulk'
    equipSlot?: string
    occupiesHandsBps?: number
    custodyHolder?: string
    isContested?: boolean
}

export interface ItemScaffoldResult {
    success: boolean
    filePath?: string
    itemId?: string
    weightClass?: string
    occupiesHandsBps?: number
    error?: string
}

export default interface ItemScaffoldBit {
    idx: string
    src?: string
    val?: number
    dat?: ItemScaffoldInput
    slv?: (value: ItemScaffoldResult) => void
}
