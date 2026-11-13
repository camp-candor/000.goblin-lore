import type MenuBit from './menu.bit.js'

export interface MenuChoiceItem {
    readonly id: string
    readonly label: string
    readonly actionType: string
    readonly tooltip: string
}

import type Model from '../../99.core/interface/model.interface.js'

export default interface Menu extends Model {
    idx: string
    menuBits: Record<string, MenuBit>
    activeSelection: string
    lastActionTimestamp: number
    statusMessage: string
    lastSomaticReceipt: string | null
    lastLifecycleReceipt: string | null
    totalInteractions: number
    activeSeries?: string
    activeEntityDomain?: string
    activeEntityPrefix?: string
    activeEntityDirectory?: string
    lastError?: string
    lastTelemetryReport: string[]
}
