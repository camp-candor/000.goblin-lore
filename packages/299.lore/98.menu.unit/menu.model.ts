import Menu from './fce/menu.interface.js'
import type MenuBit from './fce/menu.bit.js'

export class MenuModel implements Menu {
    idx: string = '98.menu'
    activeSubmenu: string = 'root'
    lst: string[] = []
    lastSelection: string = ''
}
