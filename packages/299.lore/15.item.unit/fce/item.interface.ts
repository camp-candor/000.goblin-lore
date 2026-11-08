import type ItemBit from './item.bit.js'

export default interface Item {
    idx: string
    itemBitList: ItemBit[]
    itemBits: Record<string, ItemBit>
}
