import type Stream from './fce/stream.interface.js'
import type StreamBit from './fce/stream.bit.js'

export class StreamModel implements Stream {
    idx: string = '33.stream'
    streamBitList: StreamBit[] = []
    streamBits: Record<string, StreamBit> = {}
}
