import { describe, it, expect } from 'vitest'
import {
    StringsLedgerRecordSchema,
    CharacterLeverageVectorSchema,
    makeRelationId,
} from '../val/leverage.val'
import { spendLeverageStrings } from '../buz/leverage.buzz'

describe('17.leverage.unit :: Directional Leverage String Directory Indexer', () => {
    it('formats canonical relation IDs as holder_id->debtor_id', () => {
        expect(makeRelationId('char_bog', 'char_wart')).toBe(
            'char_bog->char_wart',
        )
    })

    it('validates a well-formed directional StringsLedgerRecord', () => {
        const record = {
            relation_id: 'char_bog->char_wart',
            holder_id: 'char_bog',
            debtor_id: 'char_wart',
            weight_bps: 10000,
            strings_count: 2,
            updated_at_epoch: 0,
        }
        const parsed = StringsLedgerRecordSchema.parse(record)
        expect(parsed.relation_id).toBe('char_bog->char_wart')
        expect(parsed.strings_count).toBe(2)
    })

    it('fails closed on anti-reflexivity self-referential string assignment', () => {
        const reflex = {
            relation_id: 'char_bog->char_bog',
            holder_id: 'char_bog',
            debtor_id: 'char_bog',
            weight_bps: 10000,
            strings_count: 1,
            updated_at_epoch: 0,
        }
        expect(() => StringsLedgerRecordSchema.parse(reflex)).toThrow(
            /ANTI_REFLEXIVITY_BREACH/,
        )
    })

    it('validates CharacterLeverageVectorSchema frontmatter extraction', () => {
        const raw = {
            actor_id: 'char_bog',
            strings_held_over: ['char_wart', 'char_spleen'],
            leverage_strings: {
                char_wart: 2,
                char_spleen: 1,
            },
        }
        const parsed = CharacterLeverageVectorSchema.parse(raw)
        expect(parsed.actor_id).toBe('char_bog')
        expect(parsed.strings_held_over).toContain('char_wart')
        expect(parsed.leverage_strings.char_wart).toBe(2)
    })

    it('rejects spending leverage over self', () => {
        const records = {
            'char_bog->char_bog': {
                relation_id: 'char_bog->char_bog',
                holder_id: 'char_bog',
                debtor_id: 'char_bog',
                weight_bps: 10000,
                strings_count: 5,
                updated_at_epoch: 0,
            },
        }

        const res = spendLeverageStrings(records, {
            holder_id: 'char_bog',
            debtor_id: 'char_bog',
            spend_count: 1,
            reason: 'illegal_self_spend',
        })

        expect(res.success).toBe(false)
        expect(res.errorCode).toBe('ANTI_REFLEXIVITY_BREACH')
    })

    it('rejects spending more leverage strings than currently held (Solvency Gate)', () => {
        const records = {
            'char_bog->char_wart': {
                relation_id: 'char_bog->char_wart',
                holder_id: 'char_bog',
                debtor_id: 'char_wart',
                weight_bps: 10000,
                strings_count: 1,
                updated_at_epoch: 0,
            },
        }

        const res = spendLeverageStrings(records, {
            holder_id: 'char_bog',
            debtor_id: 'char_wart',
            spend_count: 2, // Only holds 1
            reason: 'over_spend',
        })

        expect(res.success).toBe(false)
        expect(res.errorCode).toBe('INSUFFICIENT_STRINGS_BREACH')
        expect(res.remaining_strings_count).toBe(1)
        expect(records['char_bog->char_wart'].strings_count).toBe(1) // Assert zero state mutation
    })

    it('successfully deducts leverage strings when solvency is satisfied', () => {
        const records = {
            'char_bog->char_wart': {
                relation_id: 'char_bog->char_wart',
                holder_id: 'char_bog',
                debtor_id: 'char_wart',
                weight_bps: 10000,
                strings_count: 3,
                updated_at_epoch: 0,
            },
        }

        const res = spendLeverageStrings(records, {
            holder_id: 'char_bog',
            debtor_id: 'char_wart',
            spend_count: 2,
            reason: 'concession_forced',
        })

        expect(res.success).toBe(true)
        expect(res.remaining_strings_count).toBe(1)
        expect(records['char_bog->char_wart'].strings_count).toBe(1)
    })
})
