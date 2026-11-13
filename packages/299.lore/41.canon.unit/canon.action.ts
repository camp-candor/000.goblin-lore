import type { Action } from '../99.core/interface/action.interface.js'
import type CanonBit from './fce/canon.bit.js'
import type CanonReconsiderationBit from './fce/reconsideration.bit.js'
import type CanonTrieBit from './fce/trieDisjointness.bit.js'
import type CanonDependencySweepBit from './fce/dependencySweeper.bit.js'

export const INIT_CANON = '[Canon action] Init Canon'
export class InitCanon implements Action {
    readonly type = INIT_CANON
    constructor(public bale: CanonBit) {}
}

export const UPDATE_CANON = '[Canon action] Update Canon'
export class UpdateCanon implements Action {
    readonly type = UPDATE_CANON
    constructor(public bale: CanonBit) {}
}

export const RANK_RECONSIDERATION_QUEUE =
    '[Canon action] Rank Reconsideration Queue'
export class RankReconsiderationQueue implements Action {
    readonly type = RANK_RECONSIDERATION_QUEUE
    constructor(public bale: CanonReconsiderationBit) {}
}

export const AFFIRM_STILL_GOOD = '[Canon action] Affirm Still Good'
export class AffirmStillGood implements Action {
    readonly type = AFFIRM_STILL_GOOD
    constructor(public bale: CanonReconsiderationBit) {}
}

export const VERIFY_TRIE_CLUE_DISJOINTNESS =
    '[Canon action] Verify Trie Clue Disjointness'
export class VerifyTrieClueDisjointness implements Action {
    readonly type = VERIFY_TRIE_CLUE_DISJOINTNESS
    constructor(public bale: CanonTrieBit) {}
}

export const SWEEP_ACTIVE_DEPENDENCIES =
    '[Canon action] Sweep Active Dependencies'
export class SweepActiveDependencies implements Action {
    readonly type = SWEEP_ACTIVE_DEPENDENCIES
    constructor(public bale: CanonDependencySweepBit) {}
}

export type Actions =
    | InitCanon
    | UpdateCanon
    | RankReconsiderationQueue
    | AffirmStillGood
    | VerifyTrieClueDisjointness
    | SweepActiveDependencies
