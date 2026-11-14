import type EventsBit from './events.bit.js'
import type { SignificantEventCategory } from '../../38.types.unit/fce/autoScriptRule.interface.js'

export default interface Events {
    idx: string
    eventsBitList: EventsBit[]
    eventsBits: Record<string, EventsBit>
}

export interface SixCategoryTemplate {
    sceneHeading: string
    actionLines: string[]
    characterCues: string[]
    parentheticals: string[]
    dialogue: string[]
    transitions: string[]
}

export type DramaticEventPalette = Record<
    SignificantEventCategory,
    SixCategoryTemplate
>
