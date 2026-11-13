import { describe, it, expect, afterEach } from 'vitest'
import { KineticVerbEnum, VERB_FAMILIES } from '../fce/verbs.schema.js'
import { customizeKineticVocabulary } from '../buz/verbs.buzz.js'
import {
    promptKineticVocabularyMenu,
    VOCABULARY_PRESET_CHOICES,
} from '../../98.menu.unit/buz/genesisMenu.buzz.js'

describe('299.lore - [Feature 1.3] Kinetic Verb Vocabulary Customization', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('[Task 1.3.1] validates FLY, GRAPNEL, LASSO_BIND, GLIDE, DEFLECT, DETONATE in KineticVerbEnum', () => {
        const heroicVerbs = [
            'FLY',
            'GRAPNEL',
            'LASSO_BIND',
            'GLIDE',
            'DEFLECT',
            'DETONATE',
        ] as const

        for (const verb of heroicVerbs) {
            expect(KineticVerbEnum.safeParse(verb).success).toBe(true)
            expect(VERB_FAMILIES.HEROIC_TACTICAL).toContain(verb)
        }
    })

    it('[Task 1.3.2] strips "fly" from forbidden_verbs_global when FLY is permitted', () => {
        const customized = customizeKineticVocabulary({
            permittedVerbs: [
                'fly',
                'grapnel',
                'lasso_bind',
                'glide',
                'deflect',
                'detonate',
            ],
            baseForbiddenVerbs: ['fly', 'teleport'],
        })

        expect(customized.permitted_kinetic_verbs).toEqual([
            'FLY',
            'GRAPNEL',
            'LASSO_BIND',
            'GLIDE',
            'DEFLECT',
            'DETONATE',
        ])
        expect(customized.forbidden_verbs_global).not.toContain('fly')
        expect(customized.forbidden_verbs_global).toContain('teleport')
        expect(customized.locomotion_taxonomies).toEqual([
            'BIPEDAL_STANDARD',
            'AERIAL',
        ])
    })

    it('[Task 1.3.2] promptKineticVocabularyMenu supports custom comma-separated input via Blessed TUI', async () => {
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
                    return {
                        chcBit: { src: VOCABULARY_PRESET_CHOICES[3], val: 3 },
                    }
                }
                if (action === '[Open action] Open Input') {
                    return {
                        putBit: {
                            src: 'FLY, GRAPNEL, LASSO_BIND, GLIDE, DEFLECT, DETONATE',
                            val: 0,
                        },
                    }
                }
                return {}
            },
        }

        const res = await promptKineticVocabularyMenu(
            'SUPERHERO_URBAN_VIGILANTE',
        )
        expect(res.cancelled).toBe(false)
        expect(res.value.permitted_kinetic_verbs).toContain('FLY')
        expect(res.value.permitted_kinetic_verbs).toContain('LASSO_BIND')
        expect(res.value.forbidden_verbs_global).toEqual([])
    })

    it('[Level 2.1] rejects malformed verb tokens with ZodError', () => {
        expect(() =>
            customizeKineticVocabulary({
                permittedVerbs: ['FLY-FAST!'],
            }),
        ).toThrowError()
        expect(() =>
            customizeKineticVocabulary({
                permittedVerbs: ['fly@sky'],
            }),
        ).toThrowError()
    })

    it('[Level 2.2] deduplicates mixed-case verbs and preserves unrelated forbidden verbs', () => {
        const res = customizeKineticVocabulary({
            permittedVerbs: ['fly', 'FLY', 'grapnel', 'lasso_bind'],
            baseForbiddenVerbs: ['fly', 'teleport'],
        })
        expect(res.permitted_kinetic_verbs).toEqual([
            'FLY',
            'GRAPNEL',
            'LASSO_BIND',
        ])
        expect(res.forbidden_verbs_global).toEqual(['teleport'])
    })

    it('[Level 2.3] handles modal cancellation (val: -1) and headless fallback in promptKineticVocabularyMenu', async () => {
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string) => {
                if (action === '[Grid action] Update Grid') {
                    return { grdBit: { dat: {} } }
                }
                if (action === '[Open action] Open Choice') {
                    return { chcBit: { src: '[CANCEL]', val: -1 } }
                }
                return {}
            },
        }
        const cancelledRes = await promptKineticVocabularyMenu(
            'SUPERHERO_URBAN_VIGILANTE',
        )
        expect(cancelledRes.cancelled).toBe(true)

        delete (globalThis as any).LIBRARY
        const headlessRes = await promptKineticVocabularyMenu(
            'SUPERHERO_URBAN_VIGILANTE',
        )
        expect(headlessRes.cancelled).toBe(false)
        expect(headlessRes.value.permitted_kinetic_verbs).toContain('FLY')
    })
})
