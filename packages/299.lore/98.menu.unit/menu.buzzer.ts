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
} from './buz/00.menu.buzz.js'
export {
    dispatchSomaticChoice,
    getChoiceById,
    getSomaticChoiceList,
    SOMATIC_MENU_CHOICES,
} from './buz/somaticMenu.buzz.js'
export {
    runFourTupleContractAudit,
    auditFourTupleContract,
    FOUR_TUPLE_MENU_LABEL,
} from './buz/17.four.tuple.audit.buzz.js'
export {
    runSeriesTreeScaffoldAudit,
    auditSeriesTreeScaffold,
    SERIES_TREE_MENU_LABEL,
} from './buz/18.series.tree.audit.buzz.js'
export { runPressureMeterSimulatorMenu } from './buz/06.pressure.simulator.buzz.js'
export { runAcousticParanoiaInspectorMenu } from './buz/07.acoustic.inspector.buzz.js'
export { runSynthesisPayloadValidatorMenu } from './buz/10.payload.validator.buzz.js'
