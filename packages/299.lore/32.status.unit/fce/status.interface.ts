import type StatusBit from './status.bit.js'

export interface LockRecordBit {
    readonly timestamp: number
    readonly reason: string
    readonly engaged: boolean
}

export default interface Status {
    idx: string
    isVoidState: boolean
    dispatchLockEngaged: boolean
    lockReason: string | null
    discoveredSlugs: string[]
    activeBorderColor: 'amber' | 'green' | 'yellow' | 'cyan'
    hudLines: string[]
    lockHistory: LockRecordBit[]
}
