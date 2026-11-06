/**
 * packages/299.lore/98.menu.unit/menu.model.ts
 *
 * State model for 98.menu.unit tracking active navigation and telemetry history.
 */

import type Menu from './fce/menu.interface.js'
import type MenuBit from './fce/menu.bit.js'

export class MenuModel implements Menu {
    idx: string = '98.menu'
    menuBits: Record<string, MenuBit> = {}
    activeSelection: string = 'NONE'
    lastActionTimestamp: number = 0
    statusMessage: string = 'IDLE'
    lastSomaticReceipt: string | null = null
    totalInteractions: number = 0
    activeSeries?: string = '001.goblin-lore'
    lastError?: string
    lastTelemetryReport: string[] = []
}

export default MenuModel
