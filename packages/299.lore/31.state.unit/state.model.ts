import type State from './fce/state.interface.js'
import type StateBit from './fce/state.bit.js'

export class StateModel implements State {
    idx: string = '31.state'
    stateBitList: StateBit[] = []
    stateBits: Record<string, StateBit> = {}
}
