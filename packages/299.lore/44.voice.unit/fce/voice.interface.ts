import type VoiceBit from './voice.bit'

/**
 * State container interface for 44.voice.unit
 */
export default interface Voice {
    idx?: string
    voiceBitList?: VoiceBit[]
    voiceBits?: Record<string, VoiceBit>
}
