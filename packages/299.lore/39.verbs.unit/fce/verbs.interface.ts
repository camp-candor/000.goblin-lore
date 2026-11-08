import type VerbsBit from './verbs.bit.js'

export default interface Verbs {
    idx: string
    verbsBitList: VerbsBit[]
    verbsBits: Record<string, VerbsBit>
}
