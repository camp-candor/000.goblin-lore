import { seedOriginHub } from './seedOriginHub.buzz.js'
import { seedFounderToken } from './seedFounderToken.buzz.js'
import { seedTerritorialImpasse } from './seedTerritorialImpasse.buzz.js'
import { generateSeedProtagonistDossier } from '../../02.character.unit/buz/seedProtagonist.buzz.js'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import type {
    CreatedSeedDossierBit,
    SeedGenesisResultBit,
} from '../fce/seedGenesisCorpus.bit.js'
import type SeedGenesisCorpusBit from '../fce/seedGenesisCorpus.bit.js'
import type { SeedModel } from '../seed.model.js'
import type State from '../../99.core/state.js'

export const orchestrateGenesisSeeds = async (
    cpy: SeedModel,
    bal: SeedGenesisCorpusBit,
    _ste: State,
): Promise<SeedModel> => {
    const seriesSlug = bal.src || bal.dat?.seriesSlug
    if (!seriesSlug) {
        await emitBusConsoleLog(
            'cns00',
            '>> [FAIL] orchestrateGenesisSeeds: Missing series slug.',
        )
        if (bal.slv)
            bal.slv({
                seedBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: 'MISSING_SERIES_SLUG' },
                },
            })
        return cpy
    }

    await emitBusConsoleLog(
        'cns00',
        `>> [SEED] Generating 4 Byte-0 seed dossiers for '${seriesSlug}'...`,
    )

    try {
        const dossiers: CreatedSeedDossierBit[] = []

        // 1. Origin Hub Location Seed
        const hub = await seedOriginHub(seriesSlug)
        dossiers.push(hub)
        await emitBusConsoleLog('cns00', `>> [SEED] Location seeded: ${hub.id}`)

        // 2. Founder Token Possession Seed
        const token = await seedFounderToken(seriesSlug)
        dossiers.push(token)
        await emitBusConsoleLog(
            'cns00',
            `>> [SEED] Possession seeded: ${token.id}`,
        )

        // 3. Protagonist Character Seed (reusing 02.character.unit)
        const repoRoot = resolveRepoRoot()
        const protagonistResult = await generateSeedProtagonistDossier(
            {
                seriesSlug,
                characterId: 'char_protagonist',
                locationId: 'loc_origin_hub',
                heldItemId: 'item_founder_token',
                availableArmsBps: 20000,
            },
            repoRoot,
        )

        dossiers.push({
            id: protagonistResult.characterId,
            domain: 'characters',
            relativePath: `series/${seriesSlug}/characters/${protagonistResult.characterId}.md`,
            absolutePath: protagonistResult.filePath,
            byteZeroVerified: protagonistResult.byteZeroVerified,
            contentSha256: protagonistResult.contentSha256,
        })
        await emitBusConsoleLog(
            'cns00',
            `>> [SEED] Character seeded: ${protagonistResult.characterId}`,
        )

        // 4. Territorial Impasse Grievance Seed
        const grievance = await seedTerritorialImpasse(seriesSlug)
        dossiers.push(grievance)
        await emitBusConsoleLog(
            'cns00',
            `>> [SEED] Grievance seeded: ${grievance.id}`,
        )

        const result: SeedGenesisResultBit = {
            seriesSlug,
            dossiers,
            totalWritten: dossiers.length,
        }

        await emitBusConsoleLog(
            'cns00',
            `>> [OK] 4 Byte-0 Seed Dossiers written for '${seriesSlug}'.`,
        )
        if (bal.slv) {
            bal.slv({
                seedBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: { result },
                },
            })
        }
    } catch (err: any) {
        const errorMsg = err?.message || String(err)
        await emitBusConsoleLog(
            'cns00',
            `>> [FAIL] orchestrateGenesisSeeds: ${errorMsg}`,
        )
        if (bal.slv)
            bal.slv({
                seedBit: { idx: bal.idx, val: 0, dat: { error: errorMsg } },
            })
    }

    return cpy
}
