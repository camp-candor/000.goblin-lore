/**
 * packages/299.lore/98.menu.unit/menu.buzzer.ts
 *
 * Facade export switchboard for 98.menu.unit buzzers.
 */

export {
    initMenu,
    updateMenu,
    openCompileMenu,
    triggerCompileAction,
    openSomaticDspHub,
    discoverSomaticSeriesSlugs,
    discoverSeriesCharacters,
} from './buz/00.menu.buzz'
export { runPressureMeterSimulatorMenu } from './buz/06.pressure.simulator.buzz'
export { runAcousticParanoiaInspectorMenu } from './buz/07.acoustic.inspector.buzz'
export { runSynthesisPayloadValidatorMenu } from './buz/10.payload.validator.buzz'
