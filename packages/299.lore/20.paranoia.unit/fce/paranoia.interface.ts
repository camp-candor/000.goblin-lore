import type ParanoiaBit from './paranoia.bit.js'

export default interface Paranoia {
  idx: string
  paranoiaBitList: ParanoiaBit[]
  paranoiaBits: Record<string, ParanoiaBit>
}
