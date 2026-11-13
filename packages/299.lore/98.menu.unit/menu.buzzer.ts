/**
 * packages/299.lore/98.menu.unit/menu.buzzer.ts
 *
 * Facade export switchboard for 98.menu.unit buzzers.
 */

export {
    initMenu,
    updateMenu,
    openGenesisMenu,
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
    PUBLISH_CANON_LABEL,
    LIFECYCLE_MENU_OPTIONS,
    HYGIENE_MENU_LABEL,
    openHygieneMenu,
    LAWS_MENU_LABEL,
    LAWS_REGISTRY_INSPECT_LABEL,
    LAWS_MENU_BACK_LABEL,
    openLawsMenu,
    inspectRuleRegistryAction,
    AUDIT_PARDONS_MENU_LABEL,
    auditPardonWaiversAction,
    SIMULATE_UNPARDONABLE_WAIVER_LABEL,
    simulateUnpardonableWaiverAction,
    ERRATA_DECK_MENU_LABEL,
    ERRATA_SCHEMA_VALIDATE_LABEL,
    ERRATA_MENU_BACK_LABEL,
    openErrataMenu,
    validateErrataSchemaAction,
    CANON_MENU_LABEL,
    INSPECT_STANDING_REGISTRY_LABEL,
    CANON_MENU_BACK_LABEL,
    openCanonMenu,
    inspectEpistemicStandingRegistryAction,
    RUN_STILL_GOOD_AUDIT_LABEL,
    runStillGoodAuditAction,
    EXECUTE_TRIE_DISJOINTNESS_SCAN_LABEL,
    executeTrieDisjointnessScanAction,
} from './buz/00.menu.buzz.js'
export {
    runSeriesGenesisMenu,
    sanitizeAscii,
    promptKineticVocabularyMenu,
    VOCABULARY_PRESET_CHOICES,
} from './buz/genesisMenu.buzz.js'
export {
    runEntityScaffoldMenu,
    discoverDomainForeignKeys,
} from './buz/entityScaffoldMenu.buzz.js'
export { runEntityRetirementMenu } from './buz/retirementMenu.buzz.js'
export { runCorpusHealthMenu } from './buz/corpusHealthMenu.buzz.js'
export { runErrataMenu } from './buz/errataMenu.buzz.js'
export { publishSealedCanonToFleet } from './buz/fleetPublish.buzz.js'
export { exportStaticTopologyManifest } from './buz/topologyExport.buzz.js'
export {
    runHygieneMenu,
    sweepMountedUnits,
    discoverMountedUnits,
    pingUnit,
    resolveLorePackageRoot,
    HYGIENE_LABEL,
    HYGIENE_SWEEP_LABEL,
    HYGIENE_BACK_LABEL,
} from './buz/hygieneMenu.buzz.js'
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

export {
    promptBlessedChoice,
    promptBlessedInput,
    sanitizeSeriesSlug,
    resolveLibraryBus,
} from './buz/blessedModal.buzz.js'
export type {
    GenreClassification,
    AssembledFourTupleConfig,
    BlessedChoiceModalOptions,
    BlessedInputModalOptions,
    ModalPromptResult,
} from './fce/genesisWizard.interface.js'
export {
    promptGenreModality,
    GENRE_CHOICE_MAP,
} from './buz/genesisMenu.buzz.js'
export { promptLocomotionChoice } from './buz/locomotionMenu.buzz.js'
export { LOCOMOTION_MENU_LABEL } from './buz/00.menu.buzz.js'
export { promptCustomSeedMenu } from './buz/customSeedMenu.buzz.js'
export { promptDomainEntityTypeSelector } from './buz/domainEntitySelector.buzz.js'
export {
    DOMAIN_ENTITY_REGISTRY,
    DOMAIN_ENTITY_CHOICES,
    resolveDomainEntityDescriptor,
} from './fce/domainSelector.bit.js'
