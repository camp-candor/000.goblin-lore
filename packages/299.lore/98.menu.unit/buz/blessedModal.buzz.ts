import type {
    BlessedChoiceModalOptions,
    BlessedInputModalOptions,
    ModalPromptResult,
} from '../fce/genesisWizard.interface.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const OPEN_CHOICE = '[Open action] Open Choice'
const OPEN_INPUT = '[Open action] Open Input'
const UPDATE_CONSOLE = '[Console action] Update Console'

export function resolveLibraryBus(): any {
    return (globalThis as any).LIBRARY || (global as any).LIBRARY || null
}

export function sanitizeSeriesSlug(
    raw: string,
    fallback = 'ashfall-basin',
): string {
    const cleaned = String(raw || '')
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
    return cleaned.length > 0 ? cleaned : fallback
}

export async function promptBlessedChoice(
    options: BlessedChoiceModalOptions,
): Promise<ModalPromptResult<string>> {
    const lib = resolveLibraryBus()
    const fallbackChoice =
        options.defaultValue ||
        (options.choices.length > 0 ? options.choices[0] : '')

    if (!lib || typeof lib.hunt !== 'function') {
        return { cancelled: false, value: fallbackChoice }
    }

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [WIZARD:PROMPT] ${options.promptHeader}`,
    })

    const gridBit: any = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const choiceList = [...options.choices, '[CANCEL]']
    const choiceBit: any = await lib.hunt(OPEN_CHOICE, {
        dat: {
            clr0: 'black',
            clr1: 'yellow',
        },
        src: 'vertical',
        lst: choiceList,
        net: gridBit?.grdBit?.dat,
    })

    const selected = choiceBit?.chcBit?.src ?? ''
    const exitVal = choiceBit?.chcBit?.val ?? 0

    if (exitVal === -1 || selected === '[CANCEL]' || selected === '') {
        return { cancelled: true, value: '' }
    }

    return { cancelled: false, value: selected }
}

export async function promptBlessedInput(
    options: BlessedInputModalOptions,
): Promise<ModalPromptResult<string>> {
    const lib = resolveLibraryBus()
    const fallbackText = options.defaultValue || ''

    if (!lib || typeof lib.hunt !== 'function') {
        const val = options.sanitizeSlug
            ? sanitizeSeriesSlug(fallbackText, fallbackText || 'ashfall-basin')
            : fallbackText
        return { cancelled: false, value: val }
    }

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [WIZARD:INPUT] ${options.promptLabel}`,
    })

    const gridBit: any = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 4,
    })

    const inputBit: any = await lib.hunt(OPEN_INPUT, {
        txt: options.promptLabel,
        src: fallbackText,
        dat: {
            clr0: 'green',
            clr1: 'cyan',
        },
        net: gridBit?.grdBit?.dat,
    })

    const exitVal = inputBit?.putBit?.val ?? 0
    if (exitVal === -1) {
        return { cancelled: true, value: '' }
    }

    const rawEntered = (inputBit?.putBit?.src ?? '').trim() || fallbackText
    const finalValue = options.sanitizeSlug
        ? sanitizeSeriesSlug(
              rawEntered,
              sanitizeSeriesSlug(fallbackText, 'ashfall-basin'),
          )
        : rawEntered

    return { cancelled: false, value: finalValue }
}
