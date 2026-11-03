/**
 * packages/299.lore/98.menu.unit/menu.model.ts
 *
 * State model for 98.menu.unit tracking active navigation and telemetry history.
 */

import type MenuBit from './fce/menu.bit'

export class MenuModel {
    idx: string = '98.menu'
    menuBits: Record<string, MenuBit> = {}
    activeSelection: string = 'ROOT'
    activeSeries?: string = '001.goblin-lore'
    lastError?: string
    lastTelemetryReport: string[] = []
}

export default MenuModel
