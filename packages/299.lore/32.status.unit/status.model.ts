import type Status from './fce/status.interface.js'

export class StatusModel implements Status {
    idx: string = '32.status.unit'
    isVoidState: boolean = true
    dispatchLockEngaged: boolean = true
    discoveredSlugs: string[] = []
    activeBorderColor: 'amber' | 'green' | 'yellow' | 'cyan' = 'amber'
    hudLines: string[] = []
}
