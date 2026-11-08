import type Cooldown from './fce/cooldown.interface.js'
import type CooldownBit from './fce/cooldown.bit.js'

export class CooldownModel implements Cooldown {
    idx: string = '06.cooldown'
    cooldownBitList: CooldownBit[] = []
    cooldownBits: Record<string, CooldownBit> = {}
}
