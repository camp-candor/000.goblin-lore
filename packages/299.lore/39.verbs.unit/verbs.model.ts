import type Verbs from './fce/verbs.interface.js'
import type VerbsBit from './fce/verbs.bit.js'

export class VerbsModel implements Verbs {
    idx: string = '39.verbs'
    verbsBitList: VerbsBit[] = []
    verbsBits: Record<string, VerbsBit> = {}
}
