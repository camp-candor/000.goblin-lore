import { VerbsModel } from '../verbs.model.js'
import type VerbsBit from '../fce/verbs.bit.js'
import type State from '../../99.core/state.js'
import { KineticVerbLemmaSchema } from '../val/verbs.val.js'

export const initVerbs = (
    cpy: VerbsModel,
    bal: VerbsBit,
    ste?: State,
): VerbsModel => {
    cpy.idx = bal.idx || '39.verbs'
    if (bal.slv) {
        bal.slv({ vrbBit: { idx: 'init-verbs', val: 0 } })
    }
    return cpy
}

export const updateVerbs = (
    cpy: VerbsModel,
    bal: VerbsBit,
    ste?: State,
): VerbsModel => {
    if (bal.slv) {
        bal.slv({ vrbBit: { idx: 'update-verbs', val: 0 } })
    }
    return cpy
}

export interface KineticVocabularyCustomizationInput {
    readonly permittedVerbs: readonly string[]
    readonly baseForbiddenVerbs?: readonly string[]
    readonly locomotionTaxonomies?: readonly string[]
}

export interface CustomizedActionVocabulary {
    readonly permitted_kinetic_verbs: string[]
    readonly forbidden_verbs_global: string[]
    readonly locomotion_taxonomies: string[]
}

export function customizeKineticVocabulary(
    input: KineticVocabularyCustomizationInput,
): CustomizedActionVocabulary {
    const normalizedPermitted: string[] = []
    const seenPermitted = new Set<string>()

    for (const rawVerb of input.permittedVerbs) {
        const token = String(rawVerb || '')
            .trim()
            .toUpperCase()
            .replace(/[\s-]+/g, '_')
        if (!token) continue
        KineticVerbLemmaSchema.parse(token)
        if (!seenPermitted.has(token)) {
            seenPermitted.add(token)
            normalizedPermitted.push(token)
        }
    }

    const baseForbidden = input.baseForbiddenVerbs ?? ['fly']
    const reconciledForbidden: string[] = []
    const seenForbidden = new Set<string>()

    for (const rawBanned of baseForbidden) {
        const cleanLower = String(rawBanned || '')
            .trim()
            .toLowerCase()
        const upperEquivalent = cleanLower.toUpperCase().replace(/[\s-]+/g, '_')
        if (!cleanLower) continue
        if (seenPermitted.has(upperEquivalent)) {
            continue
        }
        if (!seenForbidden.has(cleanLower)) {
            seenForbidden.add(cleanLower)
            reconciledForbidden.push(cleanLower)
        }
    }

    const defaultTaxonomies = seenPermitted.has('FLY')
        ? ['BIPEDAL_STANDARD', 'AERIAL']
        : ['BIPEDAL_HUNCHED']

    const taxonomies =
        input.locomotionTaxonomies && input.locomotionTaxonomies.length > 0
            ? [...input.locomotionTaxonomies]
            : defaultTaxonomies

    return {
        permitted_kinetic_verbs: normalizedPermitted,
        forbidden_verbs_global: reconciledForbidden,
        locomotion_taxonomies: taxonomies,
    }
}
