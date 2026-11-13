import type Menu from './fce/menu.interface.js'
import type MenuBit from './fce/menu.bit.js'

export class MenuModel implements Menu {
    idx: string = '98.menu'
    menuBits: Record<string, MenuBit> = {}
    activeSelection: string = 'NONE'
    lastActionTimestamp: number = 0
    statusMessage: string = 'IDLE'
    lastSomaticReceipt: string | null = null
    lastLifecycleReceipt: string | null = null
    totalInteractions: number = 0
    activeSeries?: string = 'under-the-floorboards'
    activeEntityDomain?: string
    activeEntityPrefix?: string
    activeEntityDirectory?: string
    lastError?: string
    lastTelemetryReport: string[] = []
}
