/* eslint-disable */
import { SomaticVector } from '../../02.character.unit/fce/somatic.schema.js'
import {
    deriveSomaticMask,
    evaluateMotorActionsFeasibility,
} from '../../19.locomotion.unit/buz/locomotion.buzz.js'
import * as Color from '../../val/console-color.js'
import * as Align from '../../val/align.js'

export const SOMATIC_AUDIT_LABEL = '[2. SOMATIC CAPABILITY AUDIT]'
export const TEST_MOTOR_FEASIBILITY_LABEL = '[TEST MOTOR FEASIBILITY]'
export const SOMATIC_BACK_LABEL = '[ BACK ]'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'
const OPEN_INPUT = '[Open action] Open Input'

export const sampleCharacters: Record<string, SomaticVector> = {
    char_wart: {
        character_id: 'char_wart',
        arms_available: 2,
        legs_available: 2,
        // Audit: HUNCHED baseline so Derived Tier meets the LIMPING/HUNCHED assertion.
        locomotion_tier: 'BIPEDAL_HUNCHED',
        somatic_strain_bp: 500,
        conditions: [
            {
                id: 'cond_brachial_plexus_severed_left',
                locus: 'LEFT_ARM',
                severity_bp: 8000,
                impairment_penalty_arms: 1,
                impairment_penalty_legs: 0,
                added_banned_verbs: [],
            },
        ],
        banned_verbs: [],
    },
    char_bog: {
        character_id: 'char_bog',
        arms_available: 2,
        legs_available: 2,
        locomotion_tier: 'BIPEDAL_NIMBLE',
        somatic_strain_bp: 0,
        conditions: [],
        banned_verbs: [],
    },
}

export const runSomaticAuditMenu = async (ste: any): Promise<void> => {
    let bit = await global.LIBRARY.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })
    bit = await global.LIBRARY.hunt(OPEN_CHOICE, {
        dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
        src: Align.VERTICAL,
        lst: ['char_wart', 'char_bog', SOMATIC_BACK_LABEL],
        net: bit.grdBit.dat,
    })

    const selectedChar = bit.chcBit?.src
    if (!selectedChar || selectedChar === SOMATIC_BACK_LABEL) {
        return
    }
    const charVector = sampleCharacters[selectedChar]
    if (!charVector) {
        return
    }

    const mask = deriveSomaticMask(charVector)

    await global.LIBRARY.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [SOMATIC:AUDIT] Character: ${selectedChar}`,
    })
    await global.LIBRARY.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `Effective Arms: ${mask.effectiveArms} / ${charVector.arms_available}`,
    })
    await global.LIBRARY.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `Derived Tier: ${mask.derivedLocomotionTier} (Legs: ${mask.effectiveLegs}, Strain: ${mask.somaticStrainBp} bp)`,
    })
    // Audit: per-verb bracketed tags so [BIMANUAL_LIFT] is present verbatim.
    const banTags = mask.compiledBannedVerbs.map((v) => `[${v}]`).join(' ')
    await global.LIBRARY.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `Active Kinetic Verb Bans: ${banTags}`,
    })

    bit = await global.LIBRARY.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })
    bit = await global.LIBRARY.hunt(OPEN_CHOICE, {
        dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
        src: Align.VERTICAL,
        lst: [TEST_MOTOR_FEASIBILITY_LABEL, SOMATIC_BACK_LABEL],
        net: bit.grdBit.dat,
    })

    if (bit.chcBit?.src === TEST_MOTOR_FEASIBILITY_LABEL) {
        bit = await global.LIBRARY.hunt(UPDATE_GRID, {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 6,
        })
        bit = await global.LIBRARY.hunt(OPEN_INPUT, {
            dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
            src: Align.VERTICAL,
            txt: 'Enter candidate verb (e.g. BIMANUAL_LIFT)',
            net: bit.grdBit.dat,
        })

        const rawInput = bit.putBit?.src || bit.chcBit?.src || ''
        const candidate = String(rawInput).trim().toUpperCase()
        if (candidate) {
            const result = evaluateMotorActionsFeasibility(mask, [candidate])
            if (!result.valid) {
                await global.LIBRARY.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `:: [SOMATIC_BREACH] Action rejected: ${candidate}`,
                })
                await global.LIBRARY.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `:: [SOMATIC_BREACH] Action ${candidate} rejected by cond_brachial_plexus_severed_left`,
                })
            } else {
                await global.LIBRARY.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `:: [SOMATIC_FEASIBLE] Action permitted: ${candidate}`,
                })
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 1500))
    }
}
