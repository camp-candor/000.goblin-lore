import type Item from './fce/item.interface.js'
import type ItemBit from './fce/item.bit.js'

export class ItemModel implements Item {
    idx: string = '15.item'
    itemBitList: ItemBit[] = []
    itemBits: Record<string, ItemBit> = {}
}
