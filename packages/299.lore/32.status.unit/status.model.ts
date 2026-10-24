import type Status from './fce/status.interface.js'
import type { LockRecordBit } from './fce/status.interface.js'

export class StatusModel implements Status {
    idx: string = '32.status.unit'
    isVoidState: boolean = true
    dispatchLockEngaged: boolean = true
    lockReason: string | null = 'COLD_BOOT_VOID_STATE'
    discoveredSlugs: string[] = []
    activeBorderColor: 'amber' | 'green' | 'yellow' | 'cyan' = 'amber'
    hudLines: string[] = []
    lockHistory: LockRecordBit[] = [
        {
            timestamp: Date.now(),
            reason: 'COLD_BOOT_VOID_STATE',
            engaged: true,
        },
    ]
}
