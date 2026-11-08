import type Trauma from './fce/trauma.interface.js'
import type TraumaBit from './fce/trauma.bit.js'

export class TraumaModel implements Trauma {
  idx: string = '37.trauma'
  traumaBitList: TraumaBit[] = []
  traumaBits: Record<string, TraumaBit> = {}
}
