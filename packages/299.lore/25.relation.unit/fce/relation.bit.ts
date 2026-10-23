import { CharacterRelationProfile } from '../val/relation.val'

export default interface RelationBit<
    TDat = unknown,
    TLst = CharacterRelationProfile,
> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    lst?: TLst[]
    slv?: (result: { relBit: Partial<RelationBit<TDat, TLst>> }) => void
}
