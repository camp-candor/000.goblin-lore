import type StreamBit from './stream.bit.js'

export default interface Stream {
    idx: string
    streamBitList: StreamBit[]
    streamBits: Record<string, StreamBit>
}
