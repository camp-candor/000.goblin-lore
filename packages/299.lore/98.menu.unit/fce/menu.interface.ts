import type MenuBit from './menu.bit'

export default interface Menu {
    idx: string
    menuBits: Record<string, MenuBit>
    activeSelection?: string
    lastTelemetryReport?: string[]
}
