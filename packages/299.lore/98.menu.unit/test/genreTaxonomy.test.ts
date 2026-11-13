import { describe, it, expect, afterEach } from 'vitest'
import {
    GenreClassificationEnum,
    GENRE_TAXONOMY_PROFILES,
    resolveGenreProfile,
    validateGenreClassification,
} from '../../38.types.unit/val/genre.val.js'
import { SeriesConfigSchema } from '../../29.series.unit/fce/series.interface.js'
import { promptGenreModality } from '../buz/genesisMenu.buzz.js'

describe('299.lore - [Feature 1.2] Genre Classification Taxonomy Expansion', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('[Task 1.2.1] validates SUPERHERO_URBAN_VIGILANTE and STANDARD in GenreClassificationEnum', () => {
        expect(validateGenreClassification('SUPERHERO_URBAN_VIGILANTE')).toBe(
            'SUPERHERO_URBAN_VIGILANTE',
        )
        expect(validateGenreClassification('STANDARD')).toBe('STANDARD')
        expect(() => validateGenreClassification('INVALID_GENRE')).toThrow()

        const heroProfile = resolveGenreProfile('SUPERHERO_URBAN_VIGILANTE')
        expect(heroProfile.primary_modal_chamber).toBe('ALETHIC')
        expect(heroProfile.secondary_modal_chamber).toBe('DEONTIC')
        expect(Number.isInteger(heroProfile.tone_bps)).toBe(true)
        expect(Number.isInteger(heroProfile.physics_bps)).toBe(true)
        expect(Number.isInteger(heroProfile.pacing_bps)).toBe(true)
    })

    it('[Task 1.2.1] SeriesConfigSchema accepts SUPERHERO_URBAN_VIGILANTE and STANDARD configurations', () => {
        const baseConfig = {
            schema_version: '1.0.0' as const,
            series_slug: 'gotham-trinity-crisis',
            display_name: 'Gotham Trinity Crisis',
            genre_tag: 'SUPERHERO_URBAN_VIGILANTE' as const,
            central_irony:
                'Restraint collides with escalation on the rooftops.',
            state_space: {
                scarcity_index_bp: 6000,
                paranoia_baseline_bp: 8000,
                somatic_fatigue_enabled: true,
                epistemic_ignorance_enabled: true,
                gram_mass_tiers: {
                    scrap_max_grams: 50,
                    weight_max_grams: 5000,
                    bulk_min_grams: 5001,
                },
            },
            action_vocabulary: {
                permitted_kinetic_verbs: ['FLY', 'GRAPNEL', 'LASSO_BIND'],
                forbidden_verbs_global: [],
                locomotion_taxonomies: ['BIPEDAL_STANDARD', 'AERIAL'],
            },
            invariant_rules: {
                max_farce_ratio_bp: 1000,
                min_grievance_depth_delta: 1,
                global_acoustic_floor_cdb: 2200,
                voiceover_ducking_db: -14,
                min_normalized_category_entropy_bp: 7000,
                thematic_categories: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
            },
            medium_projections: {
                target_fps: 24 as const,
                audio_sample_rate_hz: 48000 as const,
                tts_service_port: 8000,
                video_service_port: 8188,
                aspect_ratio: '16:9' as const,
            },
        }

        expect(SeriesConfigSchema.safeParse(baseConfig).success).toBe(true)
        expect(
            SeriesConfigSchema.safeParse({
                ...baseConfig,
                genre_tag: 'STANDARD',
            }).success,
        ).toBe(true)
        expect(GenreClassificationEnum.options).toContain(
            'SUPERHERO_URBAN_VIGILANTE',
        )
    })

    it('[Task 1.2.2] promptGenreModality presents all 5 genre presets and returns selected profile', async () => {
        let observedChoices: string[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: {
                            dat: {
                                left: '0%',
                                top: '33%',
                                width: '33%',
                                height: '66%',
                            },
                        },
                    }
                }
                if (action === '[Open action] Open Choice') {
                    observedChoices = payload.lst
                    return {
                        chcBit: {
                            src: GENRE_TAXONOMY_PROFILES
                                .SUPERHERO_URBAN_VIGILANTE.label,
                            val: 2,
                        },
                    }
                }
                return {}
            },
        }

        const result = await promptGenreModality()
        expect(result.cancelled).toBe(false)
        expect(result.value.id).toBe('SUPERHERO_URBAN_VIGILANTE')
        expect(observedChoices).toContain(
            GENRE_TAXONOMY_PROFILES.SUPERHERO_URBAN_VIGILANTE.label,
        )
        expect(observedChoices).toContain(
            GENRE_TAXONOMY_PROFILES.STANDARD.label,
        )
    })

    it('[Level 2 Trap] rejects unregistered and lowercase genre IDs in validateGenreClassification and SeriesConfigSchema', () => {
        expect(() =>
            validateGenreClassification('UNREGISTERED_GENRE_ID'),
        ).toThrow()
        expect(() => validateGenreClassification('standard')).toThrow()
        expect(
            SeriesConfigSchema.safeParse({
                schema_version: '1.0.0',
                series_slug: 'bad-genre-test',
                display_name: 'Bad Genre Test',
                genre_tag: 'UNREGISTERED_GENRE_ID',
                central_irony: 'Testing fail-closed genre rejection.',
                state_space: {
                    scarcity_index_bp: 5000,
                    paranoia_baseline_bp: 5000,
                    somatic_fatigue_enabled: true,
                    epistemic_ignorance_enabled: true,
                    gram_mass_tiers: {
                        scrap_max_grams: 50,
                        weight_max_grams: 5000,
                        bulk_min_grams: 5001,
                    },
                },
                action_vocabulary: {
                    permitted_kinetic_verbs: ['STRIKE'],
                    forbidden_verbs_global: [],
                    locomotion_taxonomies: ['BIPEDAL_STANDARD'],
                },
                invariant_rules: {
                    max_farce_ratio_bp: 1500,
                    min_grievance_depth_delta: 1,
                    global_acoustic_floor_cdb: 1500,
                    voiceover_ducking_db: -14,
                    min_normalized_category_entropy_bp: 7000,
                    thematic_categories: [
                        'C1',
                        'C2',
                        'C3',
                        'C4',
                        'C5',
                        'C6',
                        'C7',
                    ],
                },
                medium_projections: {
                    target_fps: 24,
                    audio_sample_rate_hz: 48000,
                    tts_service_port: 8000,
                    video_service_port: 8188,
                    aspect_ratio: '16:9',
                },
            }).success,
        ).toBe(false)
    })

    it('[Level 2 Trap] promptGenreModality returns cancelled=true on Escape (val=-1) or [CANCEL]', async () => {
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string) => {
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: {
                            dat: {
                                left: '0%',
                                top: '33%',
                                width: '33%',
                                height: '66%',
                            },
                        },
                    }
                }
                if (action === '[Open action] Open Choice') {
                    return { chcBit: { src: '', val: -1 } }
                }
                return {}
            },
        }
        const escRes = await promptGenreModality()
        expect(escRes.cancelled).toBe(true)
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string) => {
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: {
                            dat: {
                                left: '0%',
                                top: '33%',
                                width: '33%',
                                height: '66%',
                            },
                        },
                    }
                }
                if (action === '[Open action] Open Choice') {
                    return { chcBit: { src: '[CANCEL]', val: 5 } }
                }
                return {}
            },
        }
        const cancelRes = await promptGenreModality()
        expect(cancelRes.cancelled).toBe(true)
    })

    it('[Level 2 Trap] promptGenreModality resolves deterministically headless when LIBRARY is undefined', async () => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY

        const res = await promptGenreModality()
        expect(res.cancelled).toBe(false)
        expect(res.value.id).toBe('LOW_FANTASY_FARCE')
        expect(res.value.primary_modal_chamber).toBe('ALETHIC')
    })
})
