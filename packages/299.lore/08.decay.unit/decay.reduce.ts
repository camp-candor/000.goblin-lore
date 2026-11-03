import clone from 'clone-deep';
import * as Act from './decay.action.js';
import { DecayModel } from './decay.model.js';
import * as Buzz from './decay.buzzer.js';
import type State from '../99.core/state.js';

export function reducer(
  model: DecayModel = new DecayModel(),
  act: Act.Actions,
  state?: State,
): DecayModel {
  switch (act.type) {
    case Act.INIT_DECAY:
      return Buzz.initDecay(clone(model), act.bale, state!);

    case Act.UPDATE_DECAY:
      return Buzz.updateDecay(clone(model), act.bale, state!);

    case Act.STEP_THERMODYNAMIC_CYCLE:
      Buzz.stepThermodynamicCycle(clone(model), act.bale as any, state!);
      return model;

    case Act.EVALUATE_INTER_METER_BRIDGE:
      return Buzz.evaluateInterMeterBridge(clone(model), act.bale as any, state!);

    default:
      return model;
  }
}
