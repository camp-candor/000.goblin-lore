export default interface Status {
    idx: string
    isVoidState: boolean
    dispatchLockEngaged: boolean
    discoveredSlugs: string[]
    activeBorderColor: 'amber' | 'green' | 'yellow' | 'cyan'
    hudLines: string[]
}
