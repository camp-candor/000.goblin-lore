/**
 * packages/299.lore/98.menu.unit/fce/menu.bit.ts
 *
 * Bit communication contract for terminal menu operations in 299.lore.
 */

export default interface MenuBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    lst?: string[]
    slv?: (result: { mnuBit: MenuBit }) => void
}
