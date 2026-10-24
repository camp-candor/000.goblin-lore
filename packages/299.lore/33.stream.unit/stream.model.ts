import type Stream from './fce/stream.interface.js'

export class StreamModel implements Stream {
    idx: string = '33.stream.unit'
    lastEmittedWarning: string[] = []
    warningCount: number = 0
}
