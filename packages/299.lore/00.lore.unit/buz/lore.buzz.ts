import { LoreModel } from '../lore.model.js'
import LoreBit from '../fce/lore.bit.js'
import State from '../../99.core/state.js'

const lore = {
    list: async () => {
        return { models: [] as any[] }
    },
}

export const initLore = (cpy: LoreModel, bal: LoreBit, ste: State) => {
    const url =
        process.env.LORE_URL ||
        'https://zero00-lore.onrender.com/api/lore/test'
    if (url) {
        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                if (bal.slv != null) {
                    bal.slv({
                        intBit: {
                            idx: 'init-lore',
                            dat: {
                                lore: data,
                            },
                        },
                    })
                }
            })
            .catch((error: any) => {
                if (bal.slv != null) {
                    bal.slv({
                        intBit: { idx: 'init-lore-err', dat: error.message },
                    })
                }
            })
    } else {
        if (bal.slv != null) {
            bal.slv({ intBit: { idx: 'init-lore' } })
        }
    }
    return cpy
}

export const updateLore = (
    cpy: LoreModel,
    bal: LoreBit,
    ste: State,
) => {
    bal.slv({ intBit: { idx: 'update-lore' } })

    return cpy
}

export const testLore = (cpy: LoreModel, bal: LoreBit, ste: State) => {
    bal.slv({ mytBit: { idx: 'test-lore', val: 1 } })
    return cpy
}

export const listLore = async (
    cpy: LoreModel,
    bal: LoreBit,
    ste: State,
) => {
    const response = await lore.list()
    if (bal.slv != null)
        bal.slv({
            olmBit: {
                idx: 'list-lore',
                lst: response.models.map((m: any) => m.name),
            },
        })
    return cpy
}
