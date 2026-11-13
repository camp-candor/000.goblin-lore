import type State from '../../99.core/state.js'
import type DomainSelectorBit from '../fce/domainSelector.bit.js'
import {
    DOMAIN_ENTITY_CHOICES,
    DOMAIN_ENTITY_REGISTRY,
    resolveDomainEntityDescriptor,
    type DomainEntityType,
} from '../fce/domainSelector.bit.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const OPEN_CHOICE = '[Open action] Open Choice'
const UPDATE_CONSOLE = '[Console action] Update Console'
const CANCEL_LABEL = '[<] CANCEL DOMAIN SELECTION'

function resolveLibraryBus(): any {
    return (globalThis as any).LIBRARY || (global as any).LIBRARY || null
}

function emitConsole(ste: State | undefined, line: string): void {
    const cleanLine = String(line || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
    const lib = resolveLibraryBus()
    if (lib && typeof lib.hunt === 'function') {
        lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: cleanLine })
        return
    }
    if (ste && typeof ste.hunt === 'function') {
        ste.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: cleanLine })
    }
}

export const promptDomainEntityTypeSelector = async (
    cpy: any,
    bal: DomainSelectorBit,
    ste?: State,
): Promise<any> => {
    const lib = resolveLibraryBus()
    const defaultDomain: DomainEntityType =
        bal?.dat?.defaultDomain || 'character'
    const defaultDescriptor = DOMAIN_ENTITY_REGISTRY[defaultDomain]

    emitConsole(
        ste,
        '>> [DOMAIN:SELECTOR] Opening canonical entity domain selector...',
    )

    let selectedRaw = bal?.src !== undefined ? bal.src : defaultDescriptor.label

    if (bal?.src === undefined && lib && typeof lib.hunt === 'function') {
        const gridBit: any = await lib.hunt(UPDATE_GRID, {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 8,
        })
        const choiceBit: any = await lib.hunt(OPEN_CHOICE, {
            dat: {
                clr0: 0,
                clr1: 3,
                cb: async (choice: string) => {
                    emitConsole(ste, `:: [DOMAIN_CHOICE] ${choice}`)
                },
            },
            src: 'VERTICAL',
            lst: [...DOMAIN_ENTITY_CHOICES, CANCEL_LABEL],
            net: gridBit?.grdBit?.dat,
        })

        if (
            choiceBit?.chcBit?.val === -1 ||
            choiceBit?.chcBit?.src === CANCEL_LABEL
        ) {
            emitConsole(
                ste,
                '>> [DOMAIN:SELECTOR] [WARN] Entity domain selection cancelled by operator.',
            )
            if (bal?.slv) {
                bal.slv({
                    mnuBit: {
                        idx: 'domain-selector-cancelled',
                        val: 0,
                    },
                })
            }
            return cpy
        }

        selectedRaw = choiceBit?.chcBit?.src || defaultDescriptor.label
    }

    const resolved = resolveDomainEntityDescriptor(selectedRaw)

    if (!resolved) {
        emitConsole(
            ste,
            `:: [DOMAIN:SELECTOR] [FAIL] Invalid entity domain selection: ${selectedRaw}`,
        )
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'domain-selector-invalid',
                    val: -1,
                    src: selectedRaw,
                },
            })
        }
        return cpy
    }

    cpy.activeEntityDomain = resolved.domain
    cpy.activeEntityPrefix = resolved.idPrefix
    cpy.activeEntityDirectory = resolved.directoryName
    cpy.statusMessage = `Domain Locked: ${resolved.domain} (${resolved.idPrefix})`

    emitConsole(
        ste,
        `>> [DOMAIN:SELECTOR] [OK] Bound domain '${resolved.domain}' (prefix: ${resolved.idPrefix}, dir: ${resolved.directoryName}/)`,
    )

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'domain-selector-success',
                val: 1,
                src: resolved.domain,
                dat: { descriptor: resolved },
            },
        })
    }

    return cpy
}
