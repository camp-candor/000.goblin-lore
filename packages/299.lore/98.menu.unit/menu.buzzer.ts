export {
    initMenu,
    updateMenu,
    openFactSchemaSubmenu,
    handleGauntletMenuChoice,
    openCharacterDossierSubmenu,
    handleSchemaMenuActionBuzz,
    handleGraphMenuActionBuzz,
    type MenuActionContext,
} from './buz/00.menu.buzz.js'

export {
    runFactScopeMenuAudit,
    runAuthorityLevelMenuAudit,
    runSequenceMenuAudit,
    runLiminalStatusMenuAudit,
    runCanonHashMenuAudit,
    runByteZeroMenuAudit,
    runPreWriteInterceptorMenuAudit,
    runFactRegistryMenuAudit,
    runFullNegativeControlGauntlet,
} from './buz/menu.buzz.js'

export { executeNegativeControlSchemaGauntlet } from './buz/schemaGauntlet.buzz.js'
export { promptLocomotionChoice } from './buz/characterWizard.buzz.js'
export {
    promptEquipmentSlots,
    loadSeriesPossessionsCatalog,
} from './buz/characterTypeahead.buzz.js'
export {
    runCharacterAuditTelemetry,
    streamSomaticMaskTelemetry,
    streamVerbPolarityTelemetry,
    streamRetirementTelemetry,
} from './buz/characterTelemetry.buzz.js'

export {
    inspectGenesisHudStatus,
    streamHudTelemetryReport,
} from './buz/genesisHudMenu.buzz.js'

export {
    allocateGenesisInputGrid,
    FALLBACK_GENESIS_INPUT_GRID,
    UPDATE_GRID,
} from './buz/genesisInputGrid.buzz.js'

export {
    promptSeriesNameBuzz,
    OPEN_INPUT,
} from './buz/promptSeriesName.buzz.js'

export { openTupleWizard } from './buz/tupleWizard.buzz.js'
export { promptGenreModality } from './buz/promptGenreModality.buzz.js'
export { promptScarcityPreset } from './buz/promptScarcityPreset.buzz.js'
export { promptAcousticFloor } from './buz/promptAcousticFloor.buzz.js'
export { triggerSeedGenesisCorpusMenu } from './buz/genesisSeedMenu.buzz.js'
export { triggerCompileGenesisMenu } from './buz/compileGenesisMenu.buzz.js'
export { promptSwitchSeries } from './buz/promptSwitchSeries.buzz.js'
export { suspendCursesAndSpawnEditor } from './buz/suspendCursesEditor.buzz.js'

export { scaffoldCharacter } from './buz/menu.scaffold.js'
