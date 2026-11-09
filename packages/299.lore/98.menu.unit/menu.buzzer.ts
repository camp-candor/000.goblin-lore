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
export { runPressureMeterSimulatorMenu } from './buz/06.pressure.simulator.buzz.js'
export { runAcousticParanoiaInspectorMenu } from './buz/07.acoustic.inspector.buzz.js'
export { runSynthesisPayloadValidatorMenu } from './buz/10.payload.validator.buzz.js'

export {
    GENESIS_WIZARD_LABEL,
    ENTITY_SCAFFOLDER_LABEL,
    RETIRE_ENTITY_LABEL,
    CORPUS_HEALTH_LABEL,
    RECORD_ERRATA_LABEL,
    LIFECYCLE_MENU_OPTIONS,
} from './buz/00.menu.buzz.js'
export { runSeriesGenesisMenu, sanitizeAscii } from './buz/genesisMenu.buzz.js'
export {
    runEntityScaffoldMenu,
    discoverDomainForeignKeys,
} from './buz/entityScaffoldMenu.buzz.js'
export { runEntityRetirementMenu } from './buz/retirementMenu.buzz.js'
export { runCorpusHealthMenu } from './buz/corpusHealthMenu.buzz.js'
export { runErrataMenu } from './buz/errataMenu.buzz.js'
