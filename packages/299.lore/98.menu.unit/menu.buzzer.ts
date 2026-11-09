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
export {
    runGenesisSeedsAudit,
    auditGenesisSeeds,
    GENESIS_SEEDS_MENU_LABEL,
} from './buz/19.genesis.seeds.audit.buzz.js'
export {
    runPortalReconcileAudit,
    auditPortalReconcile,
    PORTAL_RECONCILE_MENU_LABEL,
} from './buz/20.portal.reconcile.audit.buzz.js'
export { runPressureMeterSimulatorMenu } from './buz/06.pressure.simulator.buzz.js'
export { runAcousticParanoiaInspectorMenu } from './buz/07.acoustic.inspector.buzz.js'
export { runSynthesisPayloadValidatorMenu } from './buz/10.payload.validator.buzz.js'
