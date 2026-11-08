import type LocationBit from './location.bit.js'

export default interface Location {
    idx: string
    locationBitList: LocationBit[]
    locationBits: Record<string, LocationBit>
}
