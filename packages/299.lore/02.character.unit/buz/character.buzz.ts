import { CharacterModel } from '../character.model.js'
import type CharacterBit from '../fce/character.bit.js'
import type State from '../../99.core/state.js'
import type { CharacterVoiceProfile } from '../fce/character.interface.js'
import type { SignificantEventCategory } from '../../38.types.unit/fce/autoScriptRule.interface.js'

const ALL_CATEGORIES: SignificantEventCategory[] = [
    'PARANOIA_TRIGGERED',
    'GRIEVANCE_BREACH',
    'SOMATIC_TRAUMA',
    'INVENTORY_TRANSFER',
    'EPISTEMIC_REVEAL',
    'CHRONO_MILESTONE',
]

function toAscii(raw: string): string {
    return String(raw || '')
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/[\u2014\u2013\u2015]/g, '-')
        .replace(/[\u2026]/g, '...')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function toAsciiLower(raw: string): string {
    return toAscii(raw).toLowerCase()
}

export function deriveCanonicalCueName(raw: string): string {
    const clean = toAscii(raw).trim()
    if (!clean) return 'FIGURE'
    let token = clean
    if (/^char_/i.test(token)) {
        token = token.replace(/^char_/i, '')
    }
    token = token.replace(/_/g, ' ').trim()
    const firstWord = token.split(/\s+/)[0] || 'FIGURE'
    const upper = firstWord.toUpperCase().replace(/[^A-Z0-9]/g, '')
    return upper || 'FIGURE'
}

function firstWords(text: string, maxWords: number): string {
    const words = toAscii(text).split(/\s+/).filter(Boolean).slice(0, maxWords)
    return words.join(' ')
}

function buildParenthetical(seed: string, fallback: string): string {
    const base = toAsciiLower(seed).replace(/[^a-z0-9 ,.\-']/g, '')
    const trimmed = base.split(/\s+/).filter(Boolean).slice(0, 8).join(' ')
    const inner = trimmed || fallback
    return `(${inner})`
}

function buildDialogueLine(seed: string, fallback: string): string {
    const clean = toAscii(seed).replace(/["]/g, '')
    if (clean) return clean.slice(0, 160)
    return fallback
}

const FALLBACK_PARENTHETICALS: Record<SignificantEventCategory, string> = {
    PARANOIA_TRIGGERED: 'steady, watching the ledger',
    GRIEVANCE_BREACH: 'flat, holding the old debt',
    SOMATIC_TRAUMA: 'strained, favoring the left arm',
    INVENTORY_TRANSFER: 'careful, counting the brass',
    EPISTEMIC_REVEAL: 'quiet, lowering the lamp',
    CHRONO_MILESTONE: 'even, marking the hour',
}

const FALLBACK_LINES: Record<SignificantEventCategory, string> = {
    PARANOIA_TRIGGERED: 'Valve is stuck. Keep eyes on the stair.',
    GRIEVANCE_BREACH: 'You owe for the winter tally. Pay it.',
    SOMATIC_TRAUMA: 'Arm is gone numb. Hand me the bar.',
    INVENTORY_TRANSFER: 'Count the brass. Sign the ledger.',
    EPISTEMIC_REVEAL: 'The seal was broken at dawn. Look.',
    CHRONO_MILESTONE: 'Bell marks the hour. Take your post.',
}

export function buildCharacterVoiceProfile(
    rawEntity: Record<string, any>,
): CharacterVoiceProfile {
    const entityId = String(
        rawEntity?.id ??
            rawEntity?.entity_id ??
            rawEntity?.entityId ??
            'char_unknown',
    )
    const nameRaw = String(rawEntity?.name ?? rawEntity?.title ?? entityId)
    const cue = deriveCanonicalCueName(nameRaw)
    const voiceNotes = String(
        rawEntity?.voice_notes ?? rawEntity?.voiceNotes ?? '',
    )
    const fewShot: string[] = Array.isArray(
        rawEntity?.few_shot_lines ?? rawEntity?.fewShotLines,
    )
        ? (rawEntity?.few_shot_lines ?? rawEntity?.fewShotLines)
        : []
    const wantsSurface = String(
        rawEntity?.wants_surface ?? rawEntity?.wantsSurface ?? '',
    )
    const wantsActual = String(
        rawEntity?.wants_actual ?? rawEntity?.wantsActual ?? '',
    )
    const blindSpot = String(
        rawEntity?.blind_spot ?? rawEntity?.blindSpot ?? '',
    )

    const parentheticalsByCategory = {} as Record<
        SignificantEventCategory,
        string[]
    >
    const linesByCategory = {} as Record<SignificantEventCategory, string[]>

    const voiceSeed = voiceNotes || wantsSurface || 'measured, practical tone'
    const defaultParenthetical = buildParenthetical(
        voiceSeed,
        'measured, keeping eyes on the ledger',
    )

    for (const cat of ALL_CATEGORIES) {
        const seeds: string[] = []
        if (voiceNotes) seeds.push(`${voiceNotes} [${cat}]`)
        if (blindSpot) seeds.push(`${blindSpot} [${cat}]`)
        if (wantsSurface) seeds.push(`${wantsSurface} [${cat}]`)
        if (wantsActual) seeds.push(`${wantsActual} [${cat}]`)
        const pools = seeds.map((s) =>
            buildParenthetical(s, FALLBACK_PARENTHETICALS[cat]),
        )
        pools.push(`(${FALLBACK_PARENTHETICALS[cat]})`)
        const uniq = Array.from(new Set(pools)).sort()
        parentheticalsByCategory[cat] = uniq.slice(0, 4)

        const lineSeeds: string[] = []
        for (const l of fewShot) {
            lineSeeds.push(`${String(l)}`)
        }
        if (wantsSurface) lineSeeds.push(firstWords(wantsSurface, 14))
        if (wantsActual) lineSeeds.push(firstWords(wantsActual, 14))
        const lines = lineSeeds
            .map((s) => buildDialogueLine(s, FALLBACK_LINES[cat]))
            .filter(Boolean)
        lines.push(FALLBACK_LINES[cat])
        const uniqLines = Array.from(new Set(lines.map(toAscii))).sort()
        linesByCategory[cat] = uniqLines.slice(0, 4)
    }

    const words = toAscii(voiceNotes).split(/\s+/).filter(Boolean).length
    const curtnessMaxWords = Math.max(6, Math.min(25, words > 0 ? words : 12))

    return Object.freeze({
        entityId: toAscii(entityId),
        cue,
        defaultParenthetical,
        parentheticalsByCategory: Object.freeze({
            ...parentheticalsByCategory,
        }),
        linesByCategory: Object.freeze({ ...linesByCategory }),
        curtnessMaxWords,
    }) as CharacterVoiceProfile
}

export const initCharacter = (
    cpy: CharacterModel,
    bal: CharacterBit,
    ste?: State,
): CharacterModel => {
    cpy.idx = bal.idx || '02.character'
    if (bal.slv) {
        bal.slv({ chrBit: { idx: 'init-character', val: 0 } })
    }
    return cpy
}

export const updateCharacter = (
    cpy: CharacterModel,
    bal: CharacterBit,
    ste?: State,
): CharacterModel => {
    if (bal.slv) {
        bal.slv({ chrBit: { idx: 'update-character', val: 0 } })
    }
    return cpy
}
