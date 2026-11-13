import * as fs from 'node:fs'
import * as path from 'node:path'
import { LoreModel } from '../lore.model.js'
import type LoreBit from '../fce/lore.bit.js'
import type State from '../../99.core/state.js'

export function resolveRepoRoot(startDir: string = process.cwd()): string {
    let curr = path.resolve(startDir)
    for (let i = 0; i < 6; i++) {
        if (
            fs.existsSync(path.join(curr, 'packages', '299.lore')) ||
            fs.existsSync(path.join(curr, 'series'))
        ) {
            return curr
        }
        const parent = path.dirname(curr)
        if (parent === curr) break
        curr = parent
    }
    return path.resolve(startDir)
}

export const initLore = (
    cpy: LoreModel,
    bal: LoreBit,
    ste?: State,
): LoreModel => {
    cpy.idx = bal.idx || '00.lore'
    if (bal.slv) {
        bal.slv({ lorBit: { idx: 'init-lore', val: 0, dat: cpy } })
    }
    return cpy
}

export const updateLore = (
    cpy: LoreModel,
    bal: LoreBit,
    ste?: State,
): LoreModel => {
    if (bal.slv) {
        bal.slv({ lorBit: { idx: 'update-lore', val: 0, dat: cpy } })
    }
    return cpy
}

export const testLore = (
    cpy: LoreModel,
    bal: LoreBit,
    ste?: State,
): LoreModel => {
    if (bal.slv) {
        bal.slv({ lorBit: { idx: 'test-lore', val: 1 } })
    }
    return cpy
}
