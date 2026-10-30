import { describe, expect, it } from 'vitest'
import { GrievanceSchema } from '../fce/grievance.schema'

describe('GrievanceSchema', () => {
    const validGrievance = {
        id: 'grv_spoon_credit_dispute',
        title: 'Dispute Over Good Silver Spoon Scouring',
        category: 'RESOURCE_HOARDING',
        participants_primary: ['char_bog', 'char_wart'],
        intensity_bp: 2500,
        escalation_ceiling_bp: 7500,
        cooldown_ticks: 4,
        spawns_on_max_escalation: [
            {
                type: 'grievance',
                target_id: 'grv_generational_famine_feud',
            },
        ],
        outcomes: {
            clean_win: {
                mechanics:
                    'Winner secures primary custody of spoon for 3 cycles',
                somatic_cost_bp: 500,
                strings_transferred: 1,
            },
            costly_win: {
                mechanics: 'Winner takes custody with chipped notch on handle',
                somatic_cost_bp: 1500,
                strings_transferred: 0,
            },
            mutual_wound: {
                mechanics:
                    'Both goblins retreat exhausted, spoon dropped down pipe',
                somatic_cost_bp: 3000,
                strings_transferred: 0,
            },
            backfire: {
                mechanics: 'Challenger drops leverage string to defender',
                somatic_cost_bp: 2000,
                strings_transferred: -1,
            },
        },
    }

    it('strictly validates a compliant dyadic grievance', () => {
        const res = GrievanceSchema.safeParse(validGrievance)
        expect(res.success).toBe(true)
    })

    it('rejects triadic participant configurations', () => {
        const triadic = {
            ...validGrievance,
            participants_primary: ['char_bog', 'char_wart', 'char_spleen'],
        }
        const res = GrievanceSchema.safeParse(triadic)
        expect(res.success).toBe(false)
    })

    it('rejects monadic participant configurations', () => {
        const monadic = {
            ...validGrievance,
            participants_primary: ['char_bog'],
        }
        const res = GrievanceSchema.safeParse(monadic)
        expect(res.success).toBe(false)
    })

    it('rejects un-schemaed keys via strict mode', () => {
        const extra = {
            ...validGrievance,
            runtime_dice_roll: '2d6+3',
        }
        const res = GrievanceSchema.safeParse(extra)
        expect(res.success).toBe(false)
    })
})
