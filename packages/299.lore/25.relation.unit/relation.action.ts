import { Action } from '../99.core/interface/action.interface'
import RelationBit from './fce/relation.bit'

export const INIT_RELATION = '[Relation action] Init Relation'
export class InitRelation implements Action {
    readonly type = INIT_RELATION
    constructor(public bale: RelationBit) {}
}

export const UPDATE_RELATION = '[Relation action] Update Relation'
export class UpdateRelation implements Action {
    readonly type = UPDATE_RELATION
    constructor(public bale: RelationBit) {}
}

export const REGISTER_RELATION_PROFILE =
    '[Relation action] Register Relation Profile'
export class RegisterRelationProfile implements Action {
    readonly type = REGISTER_RELATION_PROFILE
    constructor(public bale: RelationBit) {}
}

export const RESOLVE_DYADIC_ATTITUDE =
    '[Relation action] Resolve Dyadic Attitude'
export class ResolveDyadicAttitude implements Action {
    readonly type = RESOLVE_DYADIC_ATTITUDE
    constructor(public bale: RelationBit) {}
}

export const BUILD_EPISTEMIC_PROMPT = '[Relation action] Build Epistemic Prompt'
export class BuildEpistemicPrompt implements Action {
    readonly type = BUILD_EPISTEMIC_PROMPT
    constructor(public bale: RelationBit) {}
}

export type Actions =
    | InitRelation
    | UpdateRelation
    | RegisterRelationProfile
    | ResolveDyadicAttitude
    | BuildEpistemicPrompt
