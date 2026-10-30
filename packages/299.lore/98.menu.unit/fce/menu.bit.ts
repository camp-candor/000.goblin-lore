export default interface MenuBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    lst?: string[]
    slv?: (result: { mnuBit: MenuBit }) => void
}
