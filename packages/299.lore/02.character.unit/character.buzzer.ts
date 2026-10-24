export { initCharacter, updateCharacter } from './buz/character.buzz.js'
export {
    projectSomaticMask,
    getCharacterSomaticMask,
    deepFreeze,
} from './buz/somaticMask.buzz.js'
export {
    generateSeedProtagonist,
    generateSeedProtagonistDossier,
    buildSeedProtagonistDossier,
    seedCoreCharacters,
} from './buz/seedProtagonist.buzz.js'
export {
    serializeCharacterDossier,
    serializeCharacterDossierToDisk,
    buildCharacterDossierMarkdown,
} from './buz/serializer.buzz.js'
export {
    retireCharacter,
    retireCharacterDossier,
    preFlightRetireAudit,
} from './buz/retireCharacter.buzz.js'
export { inspectSomatic } from './buz/inspectSomatic.buzz.js'

export {
    scaffoldCharacterWizard,
    evaluateHandCapacitySAT,
    renderCharacterDossierMarkdown,
    writeCharacterDossierAtomic,
    LOCOMOTION_PROFILES,
    TRAUMA_CONDITIONS,
} from './buz/characterScaffold.buzz.js'
