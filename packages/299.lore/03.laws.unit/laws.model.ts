import type Laws from './fce/laws.interface.js'
import type LawsBit from './fce/laws.bit.js'
import type { Rule, Authorizer } from './fce/rule.schema.js'
import type { PardonRecord } from './fce/pardon.schema.js'

export class LawsModel implements Laws {
    idx: string = '03.laws'
    lawsBitList: LawsBit[] = []
    lawsBits: Record<string, LawsBit> = {}
    rules: Map<string, Rule> = new Map()
    authorizers: Map<string, Authorizer> = new Map()
    activePardons: Map<string, PardonRecord> = new Map()
    errataHistory: Map<string, any> = new Map()
}
