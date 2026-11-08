import type LawsBit from './laws.bit.js'
import type { Rule, Authorizer } from './rule.schema.js'
import type { PardonRecord } from './pardon.schema.js'
import type { ErrataRecord } from './errata.schema.js'

export default interface Laws {
    idx: string
    lawsBitList: LawsBit[]
    lawsBits: Record<string, LawsBit>
    rules?: Map<string, Rule>
    authorizers?: Map<string, Authorizer>
    activePardons?: Map<string, PardonRecord>
    errataHistory?: Map<string, ErrataRecord>
}
