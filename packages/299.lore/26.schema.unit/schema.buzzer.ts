export { validateEntity } from './buz/validate.buzz'
export { solveSomaticSAT } from './buz/somatic-sat.buzz'
export { deepFreeze } from './buz/freeze.buzz'

export const initSchema = (cpy: any, bal: any, _ste: any) => {
    if (bal?.slv) {
        bal.slv({ schBit: { idx: 'init-schema', val: 0 } })
    }
    return cpy
}

export const updateSchema = (cpy: any, bal: any, _ste: any) => {
    if (bal?.slv) {
        bal.slv({ schBit: { idx: 'update-schema', val: 0 } })
    }
    return cpy
}
