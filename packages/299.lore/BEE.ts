import Model from './99.core/interface/model.interface'

import LoreUnit from './00.lore.unit/lore.unit'
import ModelUnit from './01.model.unit/model.unit'
import CollectUnit from './97.collect.unit/collect.unit'
import MenuUnit from './98.menu.unit/menu.unit'
import BusUnit from './99.bus.unit/bus.unit'

import Lore from './00.lore.unit/fce/lore.interface'
import { LoreModel } from './00.lore.unit/lore.model'
import ModelInterface from './01.model.unit/fce/model.interface'
import { ModelModel } from './01.model.unit/model.model'
import Collect from './97.collect.unit/fce/collect.interface'
import { CollectModel } from './97.collect.unit/collect.model'
import Menu from './98.menu.unit/fce/menu.interface'
import { MenuModel } from './98.menu.unit/menu.model'
import Bus from './99.bus.unit/fce/bus.interface'
import { BusModel } from './99.bus.unit/bus.model'

export const list: Array<any> = [
    LoreUnit,
    ModelUnit,
    CollectUnit,
    MenuUnit,
    BusUnit,
]

import * as reduceFromLore from './00.lore.unit/lore.reduce'
import * as reduceFromModel from './01.model.unit/model.reduce'
import * as reduceFromCollect from './97.collect.unit/collect.reduce'
import * as reduceFromMenu from './98.menu.unit/menu.reduce'
import * as reduceFromBus from './99.bus.unit/bus.reduce'

export const reducer: any = {
    lore: reduceFromLore.reducer,
    model: reduceFromModel.reducer,
    collect: reduceFromCollect.reducer,
    menu: reduceFromMenu.reducer,
    bus: reduceFromBus.reducer,
}

export default class UnitData implements Model {
    lore: Lore = new LoreModel()
    model: ModelInterface = new ModelModel()
    collect: Collect = new CollectModel()
    menu: Menu = new MenuModel()
    bus: Bus = new BusModel()
}
