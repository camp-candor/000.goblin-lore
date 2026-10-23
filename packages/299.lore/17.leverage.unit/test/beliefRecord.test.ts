import { describe, it, expect } from 'vitest'
import { BeliefRecordSchema, BeliefRecord } from '../val/beliefRecord.val'
import {
    evaluateBeliefDivergence,
    propagateRumorBelief,
} from '../buz/beliefRecord.buzz'

describe('17.leverage.unit :: Subjective Belief Record Proposition Contract', () => {
    const sampleBelief: BeliefRecord = {
        belief_id: 'bel_siphon_thief_01',
        holder_id: 'char_bog',
        proposition_slug: 'fact_siphon_theft',
        proposition_tuple: {
            subject: 'snerk',
            predicate: 'stole',
            object: 'brass_siphon',
        },
        subjective_confidence_bps: 8500, // 85% conviction
        source_type: 'DIRECT_OBSERVATION',
        source_event_id: 'evt_valve_incident_02',
        parent_belief_id: null,
        hop_count: 0,
        resists_correction: true,
        recorded_at_epoch: 100,
    }

    it('validates a well-formed structured BeliefRecordSchema', () => {
        const parsed = BeliefRecordSchema.parse(sampleBelief)
        expect(parsed.belief_id).toBe('bel_siphon_thief_01')
        expect(parsed.proposition_tuple.subject).toBe('snerk')
        expect(parsed.subjective_confidence_bps).toBe(8500)
    })

    it('fails closed when TESTIMONY or RUMOR omits source_agent_id', () => {
        const invalidRumor = {
            ...sampleBelief,
            source_type: 'RUMOR',
            source_agent_id: undefined, // ILLEGAL: Must cite source agent
        }
        expect(() => BeliefRecordSchema.parse(invalidRumor)).toThrow(
            /TRANSMISSION_PROVENANCE_BREACH/,
        )
    })

    it('detects dramatic irony when character holds FALSE_BELIEF over an objectively false proposition', () => {
        // Bog believes Snerk stole the siphon (8500 bps), but world fact says KNOWN_FALSE (Spleen actually took it)
        const receipt = evaluateBeliefDivergence({
            belief: sampleBelief,
            canonical_standing: 'KNOWN_FALSE',
            canonical_truth_value: false,
        })

        expect(receipt.alignment).toBe('FALSE_BELIEF')
        expect(receipt.creates_dramatic_irony).toBe(true)
        expect(receipt.detail).toContain('Dramatic Irony')
    })

    it('confirms epistemic concordance when character belief aligns with KNOWN_TRUE world reality', () => {
        const receipt = evaluateBeliefDivergence({
            belief: sampleBelief,
            canonical_standing: 'KNOWN_TRUE',
            canonical_truth_value: true,
        })

        expect(receipt.alignment).toBe('ALIGNED_TRUE')
        expect(receipt.creates_dramatic_irony).toBe(false)
    })

    it('protects UNRESOLVED_BY_CANON propositions from binary truth classification (Ambiguity Shield)', () => {
        // Proposition regarding the origin of the famine is an unresolved mystery
        const mysteryBelief: BeliefRecord = {
            ...sampleBelief,
            proposition_slug: 'fact_cause_of_famine',
            proposition_tuple: {
                subject: 'the_watchmen',
                predicate: 'poisoned',
                object: 'the_culvert',
            },
        }

        const receipt = evaluateBeliefDivergence({
            belief: mysteryBelief,
            canonical_standing: 'UNRESOLVED_BY_CANON',
            canonical_truth_value: null,
        })

        expect(receipt.alignment).toBe('UNRESOLVED_CANON_IMMUNITY')
        expect(receipt.creates_dramatic_irony).toBe(false)
        expect(receipt.detail).toContain(
            'protected from binary truth evaluation',
        )
    })

    it('propagates rumor with incremented hop count and deterministic 8000 bps confidence decay', () => {
        const initialBelief: BeliefRecord = {
            ...sampleBelief,
            subjective_confidence_bps: 10000, // 100% confidence
        }

        // Bog tells Wart
        const wartBelief = propagateRumorBelief(
            initialBelief,
            'char_bog',
            'char_wart',
            'bel_siphon_thief_02',
        )

        expect(wartBelief.holder_id).toBe('char_wart')
        expect(wartBelief.source_agent_id).toBe('char_bog')
        expect(wartBelief.hop_count).toBe(1)
        expect(wartBelief.subjective_confidence_bps).toBe(8000) // 10000 * 0.8

        // Wart tells Spleen
        const spleenBelief = propagateRumorBelief(
            wartBelief,
            'char_wart',
            'char_spleen',
            'bel_siphon_thief_03',
        )

        expect(spleenBelief.holder_id).toBe('char_spleen')
        expect(spleenBelief.source_agent_id).toBe('char_wart')
        expect(spleenBelief.hop_count).toBe(2)
        expect(spleenBelief.subjective_confidence_bps).toBe(6400) // 8000 * 0.8
    })
})
