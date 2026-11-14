import { EventsModel } from '../events.model.js'
import type EventsBit from '../fce/events.bit.js'
import type State from '../../99.core/state.js'
import type {
    DramaticEventPalette,
    SixCategoryTemplate,
} from '../fce/events.interface.js'
import type { SignificantEventCategory } from '../../38.types.unit/fce/autoScriptRule.interface.js'

function toAscii(raw: string): string {
    return String(raw || '')
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/[\u2014\u2013\u2015]/g, '-')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function tpl(o: SixCategoryTemplate): SixCategoryTemplate {
    return Object.freeze({
        sceneHeading: toAscii(o.sceneHeading),
        actionLines: Object.freeze([...o.actionLines].map(toAscii).sort()),
        characterCues: Object.freeze([...o.characterCues].map(toAscii).sort()),
        parentheticals: Object.freeze(
            [...o.parentheticals].map(toAscii).sort(),
        ),
        dialogue: Object.freeze([...o.dialogue].map(toAscii).sort()),
        transitions: Object.freeze([...o.transitions].map(toAscii).sort()),
    }) as SixCategoryTemplate
}

export function buildEventDramaticPalette(): DramaticEventPalette {
    const palette: Record<SignificantEventCategory, SixCategoryTemplate> = {
        PARANOIA_TRIGGERED: tpl({
            sceneHeading: 'INT. CULVERT ROOM - NIGHT',
            actionLines: [
                'Lamp gutters as the pipe knocks twice.',
                'Dust sifts from the mortar seams.',
            ],
            characterCues: ['JOHNNY', 'ORBIE'],
            parentheticals: [
                '(steady, watching the ledger)',
                '(low, not looking up)',
            ],
            dialogue: [
                'Valve is stuck. Keep eyes on the stair.',
                'Say it plain. Who broke the seal.',
            ],
            transitions: ['SMASH CUT TO:'],
        }),
        GRIEVANCE_BREACH: tpl({
            sceneHeading: 'INT. LEDGER HALL - NIGHT',
            actionLines: [
                'Chalk tally squeaks across the slate.',
                'A stool scrapes back from the table.',
            ],
            characterCues: ['JOHNNY', 'WART'],
            parentheticals: [
                '(flat, holding the old debt)',
                '(dry, counting aloud)',
            ],
            dialogue: [
                'You owe for the winter tally. Pay it.',
                'Name the debt before the bell.',
            ],
            transitions: ['MATCH CUT TO:'],
        }),
        SOMATIC_TRAUMA: tpl({
            sceneHeading: 'INT. INFIRMARY CULVERT - NIGHT',
            actionLines: [
                'Breath hitches; the iron bar clatters down.',
                'Blood ticks onto the canvas sheet.',
            ],
            characterCues: ['WART', 'ORBIE'],
            parentheticals: [
                '(strained, favoring the left arm)',
                '(through teeth)',
            ],
            dialogue: [
                'Arm is gone numb. Hand me the bar.',
                'Hold still. Bind it tight.',
            ],
            transitions: ['CUT TO:'],
        }),
        INVENTORY_TRANSFER: tpl({
            sceneHeading: 'INT. STOREROOM - NIGHT',
            actionLines: [
                'Brass tallies clink onto the weighing tray.',
                'The ledger flips to a fresh page.',
            ],
            characterCues: ['ORBIE', 'JOHNNY'],
            parentheticals: [
                '(careful, counting the brass)',
                '(even, marking the page)',
            ],
            dialogue: [
                'Count the brass. Sign the ledger.',
                'Mark it. Twice for the guild.',
            ],
            transitions: ['CUT TO:'],
        }),
        EPISTEMIC_REVEAL: tpl({
            sceneHeading: 'INT. ARCHIVE ROOM - NIGHT',
            actionLines: [
                'The seal cracks; paper sighs open.',
                'Lamplight finds the hidden margin note.',
            ],
            characterCues: ['WART', 'JOHNNY'],
            parentheticals: [
                '(quiet, lowering the lamp)',
                '(reading, voice thin)',
            ],
            dialogue: [
                'The seal was broken at dawn. Look.',
                'Read the margin. Read it aloud.',
            ],
            transitions: ['FADE OUT.'],
        }),
        CHRONO_MILESTONE: tpl({
            sceneHeading: 'EXT. YARD - DUSK',
            actionLines: [
                'The bell tolls once across the basin.',
                'Lanterns lift along the fence line.',
            ],
            characterCues: ['ORBIE', 'WART'],
            parentheticals: ['(even, marking the hour)', '(calling out)'],
            dialogue: [
                'Bell marks the hour. Take your post.',
                'Shift change. Lamps up.',
            ],
            transitions: ['TIME CUT: +1 HOUR'],
        }),
    }
    return Object.freeze({ ...palette }) as DramaticEventPalette
}

export const initEvents = (
    cpy: EventsModel,
    bal: EventsBit,
    ste?: State,
): EventsModel => {
    cpy.idx = bal.idx || '11.events'
    if (bal.slv) {
        bal.slv({ evtBit: { idx: 'init-events', val: 0 } })
    }
    return cpy
}

export const updateEvents = (
    cpy: EventsModel,
    bal: EventsBit,
    ste?: State,
): EventsModel => {
    if (bal.slv) {
        bal.slv({ evtBit: { idx: 'update-events', val: 0 } })
    }
    return cpy
}
