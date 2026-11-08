import type Stage from './fce/stage.interface.js'
import type StageBit from './fce/stage.bit.js'

export class StageModel implements Stage {
    idx: string = '30.stage'
    stageBitList: StageBit[] = []
    stageBits: Record<string, StageBit> = {}
}
