import type Location from './fce/location.interface.js'
import type LocationBit from './fce/location.bit.js'

export class LocationModel implements Location {
  idx: string = '01.location'
  locationBitList: LocationBit[] = []
  locationBits: Record<string, LocationBit> = {}
}
