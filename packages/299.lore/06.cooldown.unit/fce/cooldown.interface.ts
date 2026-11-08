import type CooldownBit from './cooldown.bit.js'

export default interface Cooldown {
  idx: string
  cooldownBitList: CooldownBit[]
  cooldownBits: Record<string, CooldownBit>
}
