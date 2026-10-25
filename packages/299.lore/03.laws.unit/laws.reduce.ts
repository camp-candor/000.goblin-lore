/**
 * packages/299.lore/03.laws.unit/laws.reduce.ts
 * Reducer for 03.laws.unit.
 */
import clone from 'clone-deep'
import * as Act from './laws.action'
import { LawsModel } from './laws.model'
import * as Buzz from './laws.buzzer'
import type State from '../99.core/state'

export function reducer(
    model: LawsModel = new LawsModel(),
    act: Act.Actions,
    state?: State,
): Promise<LawsModel> | LawsModel {
    switch (act.type) {
        case Act.SCAFFOLD_WORLD_WIZARD:
            return Buzz.scaffoldWorldWizard(clone(model), act.bale, state!)

        case Act.INIT_LAWS:
            return Buzz.initLaws(clone(model), act.bale, state!)
        case Act.UPDATE_LAWS:
            return Buzz.updateLaws(clone(model), act.bale, state!)
        default:
            return model
    }
}
