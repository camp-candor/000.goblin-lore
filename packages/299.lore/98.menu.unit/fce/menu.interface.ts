import type Model from '../../99.core/interface/model.interface.js'
import type MenuBit from './menu.bit.js'

export interface MenuChoiceItem {
    readonly id: string
    readonly label: string
    readonly actionType: string
    readonly tooltip: string
}

export default interface Menu extends Model {
    idx: string
    activeSelection: string
    lastActionTimestamp: number
    statusMessage: string
    lastSomaticReceipt: string | null
    totalInteractions: number
    menuBits?: Record<string, MenuBit>
    activeSeries?: string
    lastError?: string
    lastTelemetryReport?: string[]
}
