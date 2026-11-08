import type Action from './fce/action.interface.js'
import type ActionBit from './fce/action.bit.js'

export class ActionModel implements Action {
    idx: string = '18.action'
    actionBitList: ActionBit[] = []
    actionBits: Record<string, ActionBit> = {}
}
