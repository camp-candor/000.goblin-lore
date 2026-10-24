export interface SealedHudParams {
    readonly seriesSlug: string
    readonly genreTag: string
    readonly merkleRoot: string
    readonly themeColor: 'green' | 'yellow' | 'cyan'
}

export const refreshSealedHud = async (
    params: SealedHudParams,
): Promise<void> => {
    const lib = (globalThis as any).LIBRARY
    const shortHash = params.merkleRoot.slice(0, 16)

    const lines = [
        `ACTIVE SERIES : ${params.seriesSlug} [${params.genreTag}]`,
        `CANON STATUS  : SEALED (v1.0.0)`,
        `ROOT MERKLE   : ${shortHash}...`,
        `SOWER ENGINE  : SYNCED (RIG 1 CPU)`,
    ]

    if (lib && typeof lib.hunt === 'function') {
        await lib
            .hunt('[Terminal action] Update Terminal', {
                src: lines.join('\n'),
                dat: {
                    borderClr: params.themeColor,
                    isVoidState: false,
                    dispatchLockEngaged: false,
                },
            })
            .catch(() => {})
    }
}
