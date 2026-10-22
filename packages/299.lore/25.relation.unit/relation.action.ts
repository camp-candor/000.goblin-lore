import { Action } from '../99.core/interface/action.interface'
import RelationBit from './fce/relation.bit'

// Relation actions

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

export type Actions = InitRelation | UpdateRelation
