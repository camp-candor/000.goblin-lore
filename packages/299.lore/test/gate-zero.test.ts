/**
 * packages/299.lore/test/gate-zero.test.ts
 *
 * Consolidated Gate Zero Verification Orchestrator for 299.lore.
 * Executes Pass 1 (Structural Shapes), Pass 2 (Relational Soundness),
 * and Pass 3 (Somatic & Physical SAT) in local Node.js memory at T_0 = $0.00.
 */

import { describe, it, expect } from 'vitest'
import { SchemaModel } from '../26.schema.unit/schema.model'
import { validateEntity } from '../26.schema.unit/buz/validate.buzz'
import { solveSomaticSAT } from '../26.schema.unit/buz/somatic-sat.buzz'
import BEE from '../BEE'
import SchemaUnit from '../26.schema.unit/schema.unit'

describe('299.lore - Consolidated Local Gate Zero Orchestrator', () => {
    it('certifies package registration and reducer mounting', () => {
        expect(BEE.list).toContain(SchemaUnit)
        expect(typeof BEE.reducer.schema).toBe('function')
    })

    it('orchestrates end-to-end entity certification and somatic SAT clearance', () => {
        const model = new SchemaModel()

        // 1. Ingest compliant character
        const charBit: any = {
            idx: 'gate-zero-char',
            src: 'character',
            dat: {
                id: 'char_spleen',
                title: 'Spleen the Scavenger',
                somatic: {
                    arms_available: 2,
                    legs_available: 2,
                    locomotion_tier: 'BIPEDAL_NIMBLE',
                    banned_verbs: [],
                    conditions: [],
                },
                logistical: {
                    held_primary: 'item_scraper',
                    held_secondary: null,
                },
                epistemic: {
                    paranoia_bp: 1500,
                },
            },
        }
        validateEntity(model, charBit)
        expect(charBit.val).toBe(0)

        // 2. Evaluate somatic hand capacity and kinetic action clearance
        const satBit: any = {
            idx: 'gate-zero-sat',
            src: 'somatic_sat',
            dat: {
                character: model.validatedEntities['char_spleen'],
                possessions: {
                    item_scraper: { occupies_hands: 1 },
                },
                proposedActions: ['CLIMB', 'SCUTTLE'],
            },
        }
        solveSomaticSAT(model, satBit)

        expect(satBit.val).toBe(0)
        expect(satBit.dat?.satisfied).toBe(true)
        expect(satBit.dat?.netArmsAvailable).toBe(2)
        expect(satBit.dat?.requiredHands).toBe(1)
    })
})
