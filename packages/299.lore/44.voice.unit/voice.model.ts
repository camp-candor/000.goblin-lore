import type Voice from './fce/voice.interface'
import type VoiceBit from './fce/voice.bit'

/**
 * Concrete model state for 44.voice.unit
 */
export class VoiceModel implements Voice {
    idx: string = '44.voice'
    voiceBitList: VoiceBit[] = []
    voiceBits: Record<string, VoiceBit> = {}
}
