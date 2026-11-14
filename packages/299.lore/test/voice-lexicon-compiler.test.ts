import { describe, it, expect } from 'vitest'
import {
    buildCharacterVoiceProfile,
    deriveCanonicalCueName,
} from '../02.character.unit/buz/character.buzz.js'
import { buildLocationStageProfile } from '../01.location.unit/buz/location.buzz.js'
import { buildEventDramaticPalette } from '../11.events.unit/buz/events.buzz.js'

function isAscii(s: string): boolean {
    for (let i = 0; i < s.length; i++) {
        if (s.charCodeAt(i) > 0x7f) return false
    }
    return true
}

describe('Character Voice Lexicon Dialogue Cue Compiler', () => {
    it('normalizes character cues to uppercase ASCII', () => {
        expect(deriveCanonicalCueName('CHAR_JOHNNY_WALKMAN')).toBe('JOHNNY')
        expect(deriveCanonicalCueName('Johnny Walkman')).toBe('JOHNNY')
        expect(deriveCanonicalCueName('orbie')).toBe('ORBIE')
        expect(
            isAscii(deriveCanonicalCueName('Johnny \u201CWalkman\u201D')),
        ).toBe(true)
    })

    it('derives dual-rail voice profiles with full category coverage', () => {
        const profile = buildCharacterVoiceProfile({
            id: 'char_johnny',
            name: 'Johnny Walkman',
            voice_notes: 'Short declarative sentences; gravelly cadence.',
            few_shot_lines: ['Valve is stuck. Hand me the iron bar.'],
            wants_surface: 'Keep the culvert grate clear of silt.',
            wants_actual: 'Hide the spare brass key behind the loose mortar.',
            blind_spot: 'Believes nobody notices the missing tallow tin.',
        })
        expect(profile.cue).toBe('JOHNNY')
        expect(profile.defaultParenthetical.startsWith('(')).toBe(true)
        const cats = [
            'PARANOIA_TRIGGERED',
            'GRIEVANCE_BREACH',
            'SOMATIC_TRAUMA',
            'INVENTORY_TRANSFER',
            'EPISTEMIC_REVEAL',
            'CHRONO_MILESTONE',
        ]
        for (const c of cats) {
            expect(
                (profile.parentheticalsByCategory as any)[c].length,
            ).toBeGreaterThan(0)
            expect((profile.linesByCategory as any)[c].length).toBeGreaterThan(
                0,
            )
        }
        expect(profile.curtnessMaxWords).toBeGreaterThanOrEqual(6)
    })

    it('provides fallbacks when voice fields are missing', () => {
        const profile = buildCharacterVoiceProfile({ id: 'char_empty' })
        expect(profile.cue).toBe('EMPTY')
        expect(profile.defaultParenthetical.length).toBeGreaterThan(2)
        for (const lines of Object.values(profile.linesByCategory)) {
            expect(lines.length).toBeGreaterThan(0)
        }
    })

    it('builds location stage profiles with INT and EXT routing', () => {
        const indoor = buildLocationStageProfile({
            id: 'loc_culvert',
            name: 'Brick Culvert',
            location_type: 'culvert',
        })
        expect(indoor.intExt).toBe('INT.')
        expect(indoor.sluglineBase.startsWith('INT.')).toBe(true)
        const outdoor = buildLocationStageProfile({
            id: 'loc_yard',
            name: 'South Yard',
            tags: ['yard', 'outdoor'],
        })
        expect(outdoor.intExt).toBe('EXT.')
        expect(outdoor.sluglineBase.startsWith('EXT.')).toBe(true)
        expect(outdoor.transitionOut.length).toBeGreaterThan(0)
    })

    it('covers all 6 Fountain categories per event type', () => {
        const palette: any = buildEventDramaticPalette()
        const cats = Object.keys(palette)
        expect(cats.length).toBe(6)
        for (const c of cats) {
            const t = palette[c]
            expect(t.sceneHeading.length).toBeGreaterThan(0)
            expect(t.actionLines.length).toBeGreaterThan(0)
            expect(t.characterCues.length).toBeGreaterThan(0)
            expect(t.parentheticals.length).toBeGreaterThan(0)
            expect(t.dialogue.length).toBeGreaterThan(0)
            expect(t.transitions.length).toBeGreaterThan(0)
        }
    })

    it('guarantees ASCII purity across all generated strings', () => {
        const profile = buildCharacterVoiceProfile({
            id: 'char_curly',
            name: 'Johnny \u201CWalkman\u201D \u2014 night',
            voice_notes: 'Gravelly \u201Ccadence\u201D \u2014 clipped\u2026',
            few_shot_lines: ['\u201CValve\u201D \u2014 stuck\u2026'],
        })
        const all: string[] = [
            profile.cue,
            profile.defaultParenthetical,
            ...Object.values(profile.parentheticalsByCategory).flat(),
            ...Object.values(profile.linesByCategory).flat(),
        ]
        const palette: any = buildEventDramaticPalette()
        for (const t of Object.values<any>(palette)) {
            all.push(
                t.sceneHeading,
                ...t.actionLines,
                ...t.dialogue,
                ...t.transitions,
            )
        }
        for (const s of all) {
            expect(isAscii(s)).toBe(true)
        }
    })

    it('is deterministic across shuffled key orders', () => {
        const a = buildCharacterVoiceProfile({
            id: 'char_x',
            name: 'Orbie',
            voice_notes: 'dry ledger tone',
        })
        const b = buildCharacterVoiceProfile({
            name: 'Orbie',
            voice_notes: 'dry ledger tone',
            id: 'char_x',
        })
        expect(JSON.stringify(a)).toBe(JSON.stringify(b))
        expect(JSON.stringify(buildEventDramaticPalette())).toBe(
            JSON.stringify(buildEventDramaticPalette()),
        )
    })
})
