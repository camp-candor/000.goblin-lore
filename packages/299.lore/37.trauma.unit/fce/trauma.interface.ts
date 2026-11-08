import type TraumaBit from './trauma.bit.js'

export default interface Trauma {
  idx: string
  traumaBitList: TraumaBit[]
  traumaBits: Record<string, TraumaBit>
}
