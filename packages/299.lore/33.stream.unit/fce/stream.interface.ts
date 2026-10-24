import type StreamBit from './stream.bit.js'

export default interface Stream {
    idx: string
    lastEmittedWarning: string[]
    warningCount: number
}
