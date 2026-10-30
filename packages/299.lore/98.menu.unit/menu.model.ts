import type Menu from './fce/menu.interface'
import type MenuBit from './fce/menu.bit'

export class MenuModel implements Menu {
    idx: string = '98.menu'
    menuBits: Record<string, MenuBit> = {}
    activeSelection: string = ''
    lastTelemetryReport: string[] = []
}
