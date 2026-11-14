import { LocationModel } from '../location.model.js'
import type LocationBit from '../fce/location.bit.js'
import type State from '../../99.core/state.js'
import type { LocationStageProfile } from '../fce/location.interface.js'

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

export function buildLocationStageProfile(
    rawLoc: Record<string, any>,
): LocationStageProfile {
    const locationId = toAscii(
        String(rawLoc?.id ?? rawLoc?.location_id ?? 'loc_unknown'),
    )
    const labelRaw = toAscii(
        String(rawLoc?.name ?? rawLoc?.title ?? locationId),
    )
    const typeRaw = toAscii(
        String(rawLoc?.location_type ?? rawLoc?.type ?? ''),
    ).toLowerCase()
    const tags: string[] = Array.isArray(rawLoc?.tags)
        ? rawLoc.tags.map((t: any) => toAscii(String(t)).toLowerCase())
        : []
    const hay = `${typeRaw} ${tags.join(' ')} ${labelRaw.toLowerCase()}`
    const intHints = ['indoor', 'room', 'hall', 'culvert', 'bunker', 'cellar']
    const extHints = ['street', 'yard', 'dock', 'pasture', 'field', 'outdoor']
    let intExt: 'INT.' | 'EXT.' = 'INT.'
    if (extHints.some((h) => hay.includes(h))) {
        intExt = 'EXT.'
    } else if (intHints.some((h) => hay.includes(h))) {
        intExt = 'INT.'
    }
    const label =
        labelRaw
            .toUpperCase()
            .replace(/[^A-Z0-9 ]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 48) || 'UNKNOWN ROOM'
    const timeTag = intExt === 'INT.' ? 'NIGHT' : 'DUSK'
    const sluglineBase = `${intExt} ${label} - ${timeTag}`
    const atmosphere = toAscii(
        String(
            rawLoc?.sensory_atmosphere ??
                rawLoc?.atmosphere ??
                'Damp mortar, low pipe knock, faint tallow smoke.',
        ),
    ).slice(0, 160)
    const ambientActionCue = toAscii(
        `Still air hangs over ${label.toLowerCase()}; ${atmosphere}`,
    ).slice(0, 200)
    const transitionOut = intExt === 'INT.' ? 'CUT TO:' : 'MATCH CUT TO:'
    return Object.freeze({
        locationId,
        intExt,
        sluglineBase,
        ambientActionCue,
        transitionOut,
    })
}

export const initLocation = (
    cpy: LocationModel,
    bal: LocationBit,
    ste?: State,
): LocationModel => {
    cpy.idx = bal.idx || '01.location'
    if (bal.slv) {
        bal.slv({ locBit: { idx: 'init-location', val: 0 } })
    }
    return cpy
}

export const updateLocation = (
    cpy: LocationModel,
    bal: LocationBit,
    ste?: State,
): LocationModel => {
    if (bal.slv) {
        bal.slv({ locBit: { idx: 'update-location', val: 0 } })
    }
    return cpy
}
