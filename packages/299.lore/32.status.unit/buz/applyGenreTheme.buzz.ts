export interface GenreThemeResult {
    readonly genreTag:
        'LOW_FANTASY_FARCE' | 'SOUTHERN_GOTHIC_INDUSTRIAL' | 'HARD_SCIFI_VACUUM'
    readonly themeColor: 'green' | 'yellow' | 'cyan'
    readonly borderFormatted: string
}

export const applyGenreTheme = async (
    genreTag: string,
): Promise<GenreThemeResult> => {
    let themeColor: 'green' | 'yellow' | 'cyan' = 'yellow'
    let borderFormatted = '{yellow-fg}'

    switch (genreTag) {
        case 'LOW_FANTASY_FARCE':
            themeColor = 'green'
            borderFormatted = '{green-fg}'
            break
        case 'HARD_SCIFI_VACUUM':
            themeColor = 'cyan'
            borderFormatted = '{cyan-fg}'
            break
        case 'SOUTHERN_GOTHIC_INDUSTRIAL':
        default:
            themeColor = 'yellow'
            borderFormatted = '{yellow-fg}'
            break
    }

    const lib = (globalThis as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        await lib
            .hunt('[Terminal action] Update Terminal', {
                dat: { borderClr: themeColor },
            })
            .catch(() => {})
    }

    return {
        genreTag: genreTag as any,
        themeColor,
        borderFormatted,
    }
}
