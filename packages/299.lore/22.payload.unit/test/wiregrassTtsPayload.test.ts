import { describe, it, expect } from 'vitest'
import path from 'node:path'
import {
    loadConditionsCatalogFromDisk,
    extractCharacterSomaticRecord,
} from '../../16.ledger.unit/buz/extractSomaticLedger.buzz.js'
import {
    verifyWiregrassCanonSealForTts,
    buildCharacterTtsRequestFromLedger,
} from '../buz/buildWiregrassTtsPayload.buzz.js'
import { assertDialogueRhythmRatio } from '../buz/validateTtsPayload.buzz.js'
import { PayloadModel } from '../payload.model.js'
import { initPayload, validateTtsPayload } from '../payload.buzzer.js'

describe('22.payload.unit :: Wiregrass Basin (The Parallax Dinner) TTS Handoff Verification', () => {
    const repoRoot = path.resolve(__dirname, '../../../../')
    const biblePath = path.join(
        repoRoot,
        'compiled/wiregrass-basin/bible-state.json',
    )
    const conditionsPath = path.join(
        repoRoot,
        'series/wiregrass-basin/world/conditions.md',
    )
    const johnnyPath = path.join(
        repoRoot,
        'series/wiregrass-basin/characters/char_johnny_walkman.md',
    )
    const orbiePath = path.join(
        repoRoot,
        'series/wiregrass-basin/characters/char_orbie_mayhaw.md',
    )
    const beverlyPath = path.join(
        repoRoot,
        'series/wiregrass-basin/characters/char_miss_beverly.md',
    )

    it('verifies the sealed compiled/wiregrass-basin/bible-state.json Merkle root and entity hashes', () => {
        const seal = verifyWiregrassCanonSealForTts(biblePath)
        expect(seal.seriesSlug).toBe('wiregrass-basin')
        expect(seal.rootMerkleHash).toMatch(/^[0-9a-f]{64}$/)
        expect(seal.totalEntities).toBe(9)
        expect(seal.entityHashes['char_johnny_walkman']).toMatch(
            /^[0-9a-f]{64}$/,
        )
        expect(seal.entityHashes['char_orbie_mayhaw']).toMatch(/^[0-9a-f]{64}$/)
        expect(seal.entityHashes['char_miss_beverly']).toMatch(/^[0-9a-f]{64}$/)
    })

    it('builds and validates TTSGenerationRequest for Johnny Walkman and Dr. Orbie Mayhaw dialogue lines', () => {
        const catalog = loadConditionsCatalogFromDisk(conditionsPath)
        const johnnyRec = extractCharacterSomaticRecord(johnnyPath, catalog)
        const orbieRec = extractCharacterSomaticRecord(orbiePath, catalog)

        const johnnyTurn = buildCharacterTtsRequestFromLedger({
            record: johnnyRec,
            sceneId: 'sc_dixie_starlight_diner_01',
            lineId: 'line_johnny_001',
            verbatimText:
                'Folks across the basin, the rain is coming down in sheets on the asphalt.',
        })

        expect(johnnyTurn.receipt.status).toBe('PASSED')
        expect(johnnyTurn.request.characterId).toBe('char_johnny_walkman')
        expect(
            johnnyTurn.request.composedDspMatrix.effectivePitchCentitones,
        ).toBe(-200)
        expect(johnnyTurn.request.composedDspMatrix.bannedCadences).toContain(
            'CLIPPED_MILITARY',
        )
        expect(Object.isFrozen(johnnyTurn.request)).toBe(true)
        expect(Object.isFrozen(johnnyTurn.request.composedDspMatrix)).toBe(true)

        const orbieTurn = buildCharacterTtsRequestFromLedger({
            record: orbieRec,
            sceneId: 'sc_dixie_starlight_diner_01',
            lineId: 'line_orbie_001',
            verbatimText:
                'No thank you, Miss Beverly. The steam compromises my progressive lenses.',
        })

        expect(orbieTurn.receipt.status).toBe('PASSED')
        expect(orbieTurn.request.characterId).toBe('char_orbie_mayhaw')
        expect(
            orbieTurn.request.composedDspMatrix.effectivePitchCentitones,
        ).toBe(150)
        expect(orbieTurn.request.somaticMask.bannedKineticVerbs).toEqual([
            'head_tilt',
            'nod',
            'slouch',
        ])
    })

    it('rejects un-sanitized UTF-8 punctuation in dialogue lines and traps aphonic speech breaches', () => {
        const catalog = loadConditionsCatalogFromDisk(conditionsPath)
        const beverlyRec = extractCharacterSomaticRecord(beverlyPath, catalog)

        expect(() =>
            buildCharacterTtsRequestFromLedger({
                record: beverlyRec,
                sceneId: 'sc_dixie_starlight_diner_01',
                lineId: 'line_beverly_utf8',
                verbatimText: 'Curly apostrophe \u2019 breach.',
            }),
        ).toThrow('NON_ASCII_DIALOGUE_DETECTED')

        expect(() =>
            buildCharacterTtsRequestFromLedger({
                record: beverlyRec,
                sceneId: 'sc_dixie_starlight_diner_01',
                lineId: 'line_beverly_mute',
                verbatimText: 'Attempting speech while non-speaking.',
                canSpeak: false,
            }),
        ).toThrow('VOCAL_DELIVERY_BREACH')
    })

    it('verifies dialogue rhythm ratio across interleaved Johnny, Orbie, and Action beats', () => {
        const parallaxSequence = [
            {
                type: 'DIALOGUE' as const,
                speakerId: 'char_johnny_walkman',
                text: 'Turn 1',
            },
            {
                type: 'DIALOGUE' as const,
                speakerId: 'char_orbie_mayhaw',
                text: 'Turn 2',
            },
            {
                type: 'ACTION' as const,
                text: 'Miss Beverly sets down the laminated menus.',
            },
            {
                type: 'DIALOGUE' as const,
                speakerId: 'char_johnny_walkman',
                text: 'Turn 3',
            },
            {
                type: 'DIALOGUE' as const,
                speakerId: 'char_orbie_mayhaw',
                text: 'Turn 4',
            },
        ]

        const rhythm = assertDialogueRhythmRatio(parallaxSequence, 2)
        expect(rhythm.valid).toBe(true)
    })

    it('dispatches validated Parallax Dinner payloads through PayloadModel and validateTtsPayload buzzer', () => {
        const catalog = loadConditionsCatalogFromDisk(conditionsPath)
        const orbieRec = extractCharacterSomaticRecord(orbiePath, catalog)
        const { request } = buildCharacterTtsRequestFromLedger({
            record: orbieRec,
            sceneId: 'sc_dixie_starlight_diner_01',
            lineId: 'line_orbie_002',
            verbatimText:
                'An uncalibrated horizon introduces three diopters of rotational error.',
        })

        const model = new PayloadModel()
        initPayload(model, { idx: 'init' }, {} as any)

        let receipt: any
        validateTtsPayload(
            model,
            {
                idx: 'validate-orbie-line',
                dat: { candidatePayload: request },
                slv: (res) => {
                    receipt = res.pldBit.dat
                },
            },
            { hunt: async () => {} } as any,
        )

        expect(receipt).toBeDefined()
        expect(receipt.status).toBe('PASSED')
        expect(model.totalValidatedCount).toBe(1)
        expect(model.validatedPayloads['line_orbie_002']).toBeDefined()
    })
})
