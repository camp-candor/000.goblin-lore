/**
 * packages/299.lore/98.menu.unit/fce/menu.bit.ts
 *
 * Bit communication contract for terminal menu operations in 299.lore.
 */

export default interface MenuBit<TDat = any, TLst = string> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    lst?: TLst[]
    slv?: (result: { mnuBit: Partial<MenuBit<TDat, TLst>> }) => void
}
