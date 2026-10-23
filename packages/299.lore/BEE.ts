import Model from './99.core/interface/model.interface'

import LoreUnit from './00.lore.unit/lore.unit'
import LocationUnit from './01.location.unit/location.unit'
import CharacterUnit from './02.character.unit/character.unit'
import LawsUnit from './03.laws.unit/laws.unit'
import LogisticUnit from './04.logistic.unit/logistic.unit'
import ClockUnit from './05.clock.unit/clock.unit'
import FactsUnit from './06.facts.unit/facts.unit'
import DatabaseUnit from './07.database.unit/database.unit'
import DecayUnit from './08.decay.unit/decay.unit'
import EntityUnit from './09.entity.unit/entity.unit'
import EscalationUnit from './10.escalation.unit/escalation.unit'
import EventsUnit from './11.events.unit/events.unit'
import GearUnit from './12.gear.unit/gear.unit'
import GrievanceUnit from './13.grievance.unit/grievance.unit'
import IntensityUnit from './14.intensity.unit/intensity.unit'
import ItemUnit from './15.item.unit/item.unit'
import LedgerUnit from './16.ledger.unit/ledger.unit'
import LeverageUnit from './17.leverage.unit/leverage.unit'
import ActionUnit from './18.action.unit/action.unit'
import LocomotionUnit from './19.locomotion.unit/locomotion.unit'
import ParanoiaUnit from './20.paranoia.unit/paranoia.unit'
import PayloadUnit from './22.payload.unit/payload.unit'
import PortUnit from './23.port.unit/port.unit'
import PrimordialUnit from './24.primordial.unit/primordial.unit'
import RelationUnit from './25.relation.unit/relation.unit'
import SchemaUnit from './26.schema.unit/schema.unit'
import SeedUnit from './27.seed.unit/seed.unit'
import SequenceUnit from './28.sequence.unit/sequence.unit'
import SeriesUnit from './29.series.unit/series.unit'
import StageUnit from './30.stage.unit/stage.unit'
import StateUnit from './31.state.unit/state.unit'
import StatusUnit from './32.status.unit/status.unit'
import StreamUnit from './33.stream.unit/stream.unit'
import TargetUnit from './34.target.unit/target.unit'
import ThresholdUnit from './35.threshold.unit/threshold.unit'
import TickUnit from './36.tick.unit/tick.unit'
import TraumaUnit from './37.trauma.unit/trauma.unit'
import TypesUnit from './38.types.unit/types.unit'
import VerbsUnit from './39.verbs.unit/verbs.unit'
import WoundUnit from './40.wound.unit/wound.unit'
import CanonUnit from './41.canon.unit/canon.unit'
import CatalystUnit from './42.catalyst.unit/catalyst.unit'
import CooldownUnit from './43.cooldown.unit/cooldown.unit'
import VoiceUnit from './44.voice.unit/voice.unit'
import ModelUnit from './96.model.unit/model.unit'
import CollectUnit from './97.collect.unit/collect.unit'
import MenuUnit from './98.menu.unit/menu.unit'
import BusUnit from './99.bus.unit/bus.unit'

import Lore from './00.lore.unit/fce/lore.interface'
import { LoreModel } from './00.lore.unit/lore.model'
import Location from './01.location.unit/fce/location.interface'
import { LocationModel } from './01.location.unit/location.model'
import Character from './02.character.unit/fce/character.interface'
import { CharacterModel } from './02.character.unit/character.model'
import Laws from './03.laws.unit/fce/laws.interface'
import { LawsModel } from './03.laws.unit/laws.model'
import Logistic from './04.logistic.unit/fce/logistic.interface'
import { LogisticModel } from './04.logistic.unit/logistic.model'
import Clock from './05.clock.unit/fce/clock.interface'
import { ClockModel } from './05.clock.unit/clock.model'
import Facts from './06.facts.unit/fce/facts.interface'
import { FactsModel } from './06.facts.unit/facts.model'
import Database from './07.database.unit/fce/database.interface'
import { DatabaseModel } from './07.database.unit/database.model'
import Decay from './08.decay.unit/fce/decay.interface'
import { DecayModel } from './08.decay.unit/decay.model'
import Entity from './09.entity.unit/fce/entity.interface'
import { EntityModel } from './09.entity.unit/entity.model'
import Escalation from './10.escalation.unit/fce/escalation.interface'
import { EscalationModel } from './10.escalation.unit/escalation.model'
import Events from './11.events.unit/fce/events.interface'
import { EventsModel } from './11.events.unit/events.model'
import Gear from './12.gear.unit/fce/gear.interface'
import { GearModel } from './12.gear.unit/gear.model'
import Grievance from './13.grievance.unit/fce/grievance.interface'
import { GrievanceModel } from './13.grievance.unit/grievance.model'
import Intensity from './14.intensity.unit/fce/intensity.interface'
import { IntensityModel } from './14.intensity.unit/intensity.model'
import Item from './15.item.unit/fce/item.interface'
import { ItemModel } from './15.item.unit/item.model'
import Ledger from './16.ledger.unit/fce/ledger.interface'
import { LedgerModel } from './16.ledger.unit/ledger.model'
import Leverage from './17.leverage.unit/fce/leverage.interface'
import { LeverageModel } from './17.leverage.unit/leverage.model'
import Action from './18.action.unit/fce/action.interface'
import { ActionModel } from './18.action.unit/action.model'
import Locomotion from './19.locomotion.unit/fce/locomotion.interface'
import { LocomotionModel } from './19.locomotion.unit/locomotion.model'
import Paranoia from './20.paranoia.unit/fce/paranoia.interface'
import { ParanoiaModel } from './20.paranoia.unit/paranoia.model'
import Payload from './22.payload.unit/fce/payload.interface'
import { PayloadModel } from './22.payload.unit/payload.model'
import Port from './23.port.unit/fce/port.interface'
import { PortModel } from './23.port.unit/port.model'
import Primordial from './24.primordial.unit/fce/primordial.interface'
import { PrimordialModel } from './24.primordial.unit/primordial.model'
import Relation from './25.relation.unit/fce/relation.interface'
import { RelationModel } from './25.relation.unit/relation.model'
import Schema from './26.schema.unit/fce/schema.interface'
import { SchemaModel } from './26.schema.unit/schema.model'
import Seed from './27.seed.unit/fce/seed.interface'
import { SeedModel } from './27.seed.unit/seed.model'
import Sequence from './28.sequence.unit/fce/sequence.interface'
import { SequenceModel } from './28.sequence.unit/sequence.model'
import Series from './29.series.unit/fce/series.interface'
import { SeriesModel } from './29.series.unit/series.model'
import Stage from './30.stage.unit/fce/stage.interface'
import { StageModel } from './30.stage.unit/stage.model'
import State from './31.state.unit/fce/state.interface'
import { StateModel } from './31.state.unit/state.model'
import Status from './32.status.unit/fce/status.interface'
import { StatusModel } from './32.status.unit/status.model'
import Stream from './33.stream.unit/fce/stream.interface'
import { StreamModel } from './33.stream.unit/stream.model'
import Target from './34.target.unit/fce/target.interface'
import { TargetModel } from './34.target.unit/target.model'
import Threshold from './35.threshold.unit/fce/threshold.interface'
import { ThresholdModel } from './35.threshold.unit/threshold.model'
import Tick from './36.tick.unit/fce/tick.interface'
import { TickModel } from './36.tick.unit/tick.model'
import Trauma from './37.trauma.unit/fce/trauma.interface'
import { TraumaModel } from './37.trauma.unit/trauma.model'
import Types from './38.types.unit/fce/types.interface'
import { TypesModel } from './38.types.unit/types.model'
import Verbs from './39.verbs.unit/fce/verbs.interface'
import { VerbsModel } from './39.verbs.unit/verbs.model'
import Wound from './40.wound.unit/fce/wound.interface'
import { WoundModel } from './40.wound.unit/wound.model'
import Canon from './41.canon.unit/fce/canon.interface'
import { CanonModel } from './41.canon.unit/canon.model'
import Catalyst from './42.catalyst.unit/fce/catalyst.interface'
import { CatalystModel } from './42.catalyst.unit/catalyst.model'
import Cooldown from './43.cooldown.unit/fce/cooldown.interface'
import { CooldownModel } from './43.cooldown.unit/cooldown.model'
import Voice from './44.voice.unit/fce/voice.interface'
import { VoiceModel } from './44.voice.unit/voice.model'
import ModelInterface from './96.model.unit/fce/model.interface'
import { ModelModel } from './96.model.unit/model.model'
import Collect from './97.collect.unit/fce/collect.interface'
import { CollectModel } from './97.collect.unit/collect.model'
import Menu from './98.menu.unit/fce/menu.interface'
import { MenuModel } from './98.menu.unit/menu.model'
import Bus from './99.bus.unit/fce/bus.interface'
import { BusModel } from './99.bus.unit/bus.model'

export const list: Array<any> = [
    LoreUnit,
    LocationUnit,
    CharacterUnit,
    LawsUnit,
    LogisticUnit,
    ClockUnit,
    FactsUnit,
    DatabaseUnit,
    DecayUnit,
    EntityUnit,
    EscalationUnit,
    EventsUnit,
    GearUnit,
    GrievanceUnit,
    IntensityUnit,
    ItemUnit,
    LedgerUnit,
    LeverageUnit,
    ActionUnit,
    LocomotionUnit,
    ParanoiaUnit,
    PayloadUnit,
    PortUnit,
    PrimordialUnit,
    RelationUnit,
    SchemaUnit,
    SeedUnit,
    SequenceUnit,
    SeriesUnit,
    StageUnit,
    StateUnit,
    StatusUnit,
    StreamUnit,
    TargetUnit,
    ThresholdUnit,
    TickUnit,
    TraumaUnit,
    TypesUnit,
    VerbsUnit,
    WoundUnit,
    CanonUnit,
    CatalystUnit,
    CooldownUnit,
    VoiceUnit,
    ModelUnit,
    CollectUnit,
    MenuUnit,
    BusUnit,
]

import * as reduceFromLore from './00.lore.unit/lore.reduce'
import * as reduceFromLocation from './01.location.unit/location.reduce'
import * as reduceFromCharacter from './02.character.unit/character.reduce'
import * as reduceFromLaws from './03.laws.unit/laws.reduce'
import * as reduceFromLogistic from './04.logistic.unit/logistic.reduce'
import * as reduceFromClock from './05.clock.unit/clock.reduce'
import * as reduceFromFacts from './06.facts.unit/facts.reduce'
import * as reduceFromDatabase from './07.database.unit/database.reduce'
import * as reduceFromDecay from './08.decay.unit/decay.reduce'
import * as reduceFromEntity from './09.entity.unit/entity.reduce'
import * as reduceFromEscalation from './10.escalation.unit/escalation.reduce'
import * as reduceFromEvents from './11.events.unit/events.reduce'
import * as reduceFromGear from './12.gear.unit/gear.reduce'
import * as reduceFromGrievance from './13.grievance.unit/grievance.reduce'
import * as reduceFromIntensity from './14.intensity.unit/intensity.reduce'
import * as reduceFromItem from './15.item.unit/item.reduce'
import * as reduceFromLedger from './16.ledger.unit/ledger.reduce'
import * as reduceFromLeverage from './17.leverage.unit/leverage.reduce'
import * as reduceFromAction from './18.action.unit/action.reduce'
import * as reduceFromLocomotion from './19.locomotion.unit/locomotion.reduce'
import * as reduceFromParanoia from './20.paranoia.unit/paranoia.reduce'
import * as reduceFromPayload from './22.payload.unit/payload.reduce'
import * as reduceFromPort from './23.port.unit/port.reduce'
import * as reduceFromPrimordial from './24.primordial.unit/primordial.reduce'
import * as reduceFromRelation from './25.relation.unit/relation.reduce'
import * as reduceFromSchema from './26.schema.unit/schema.reduce'
import * as reduceFromSeed from './27.seed.unit/seed.reduce'
import * as reduceFromSequence from './28.sequence.unit/sequence.reduce'
import * as reduceFromSeries from './29.series.unit/series.reduce'
import * as reduceFromStage from './30.stage.unit/stage.reduce'
import * as reduceFromState from './31.state.unit/state.reduce'
import * as reduceFromStatus from './32.status.unit/status.reduce'
import * as reduceFromStream from './33.stream.unit/stream.reduce'
import * as reduceFromTarget from './34.target.unit/target.reduce'
import * as reduceFromThreshold from './35.threshold.unit/threshold.reduce'
import * as reduceFromTick from './36.tick.unit/tick.reduce'
import * as reduceFromTrauma from './37.trauma.unit/trauma.reduce'
import * as reduceFromTypes from './38.types.unit/types.reduce'
import * as reduceFromVerbs from './39.verbs.unit/verbs.reduce'
import * as reduceFromWound from './40.wound.unit/wound.reduce'
import * as reduceFromCanon from './41.canon.unit/canon.reduce'
import * as reduceFromCatalyst from './42.catalyst.unit/catalyst.reduce'
import * as reduceFromCooldown from './43.cooldown.unit/cooldown.reduce'
import * as reduceFromVoice from './44.voice.unit/voice.reduce'
import * as reduceFromModel from './96.model.unit/model.reduce'
import * as reduceFromCollect from './97.collect.unit/collect.reduce'
import * as reduceFromMenu from './98.menu.unit/menu.reduce'
import * as reduceFromBus from './99.bus.unit/bus.reduce'

export const reducer: any = {
    lore: reduceFromLore.reducer,
    location: reduceFromLocation.reducer,
    character: reduceFromCharacter.reducer,
    laws: reduceFromLaws.reducer,
    logistic: reduceFromLogistic.reducer,
    clock: reduceFromClock.reducer,
    facts: reduceFromFacts.reducer,
    database: reduceFromDatabase.reducer,
    decay: reduceFromDecay.reducer,
    entity: reduceFromEntity.reducer,
    escalation: reduceFromEscalation.reducer,
    events: reduceFromEvents.reducer,
    gear: reduceFromGear.reducer,
    grievance: reduceFromGrievance.reducer,
    intensity: reduceFromIntensity.reducer,
    item: reduceFromItem.reducer,
    ledger: reduceFromLedger.reducer,
    leverage: reduceFromLeverage.reducer,
    action: reduceFromAction.reducer,
    locomotion: reduceFromLocomotion.reducer,
    paranoia: reduceFromParanoia.reducer,
    payload: reduceFromPayload.reducer,
    port: reduceFromPort.reducer,
    primordial: reduceFromPrimordial.reducer,
    relation: reduceFromRelation.reducer,
    schema: reduceFromSchema.reducer,
    seed: reduceFromSeed.reducer,
    sequence: reduceFromSequence.reducer,
    series: reduceFromSeries.reducer,
    stage: reduceFromStage.reducer,
    state: reduceFromState.reducer,
    status: reduceFromStatus.reducer,
    stream: reduceFromStream.reducer,
    target: reduceFromTarget.reducer,
    threshold: reduceFromThreshold.reducer,
    tick: reduceFromTick.reducer,
    trauma: reduceFromTrauma.reducer,
    types: reduceFromTypes.reducer,
    verbs: reduceFromVerbs.reducer,
    wound: reduceFromWound.reducer,
    canon: reduceFromCanon.reducer,
    catalyst: reduceFromCatalyst.reducer,
    cooldown: reduceFromCooldown.reducer,
    voice: reduceFromVoice.reducer,
    model: reduceFromModel.reducer,
    collect: reduceFromCollect.reducer,
    menu: reduceFromMenu.reducer,
    bus: reduceFromBus.reducer,
}

export default class UnitData implements Model {
    lore: Lore = new LoreModel()
    location: Location = new LocationModel()
    character: Character = new CharacterModel()
    laws: Laws = new LawsModel()
    logistic: Logistic = new LogisticModel()
    clock: Clock = new ClockModel()
    facts: Facts = new FactsModel()
    database: Database = new DatabaseModel()
    decay: Decay = new DecayModel()
    entity: Entity = new EntityModel()
    escalation: Escalation = new EscalationModel()
    events: Events = new EventsModel()
    gear: Gear = new GearModel()
    grievance: Grievance = new GrievanceModel()
    intensity: Intensity = new IntensityModel()
    item: Item = new ItemModel()
    ledger: Ledger = new LedgerModel()
    leverage: Leverage = new LeverageModel()
    action: Action = new ActionModel()
    locomotion: Locomotion = new LocomotionModel()
    paranoia: Paranoia = new ParanoiaModel()
    payload: Payload = new PayloadModel()
    port: Port = new PortModel()
    primordial: Primordial = new PrimordialModel()
    relation: Relation = new RelationModel()
    schema: Schema = new SchemaModel()
    seed: Seed = new SeedModel()
    sequence: Sequence = new SequenceModel()
    series: Series = new SeriesModel()
    stage: Stage = new StageModel()
    state: State = new StateModel()
    status: Status = new StatusModel()
    stream: Stream = new StreamModel()
    target: Target = new TargetModel()
    threshold: Threshold = new ThresholdModel()
    tick: Tick = new TickModel()
    trauma: Trauma = new TraumaModel()
    types: Types = new TypesModel()
    verbs: Verbs = new VerbsModel()
    wound: Wound = new WoundModel()
    canon: Canon = new CanonModel()
    catalyst: Catalyst = new CatalystModel()
    cooldown: Cooldown = new CooldownModel()
    voice: Voice = new VoiceModel()
    model: ModelInterface = new ModelModel()
    collect: Collect = new CollectModel()
    menu: Menu = new MenuModel()
    bus: Bus = new BusModel()
}

export { reduceFromVoice }
