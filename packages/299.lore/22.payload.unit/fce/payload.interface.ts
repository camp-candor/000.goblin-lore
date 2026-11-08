import type PayloadBit from './payload.bit.js'

export default interface Payload {
  idx: string
  payloadBitList: PayloadBit[]
  payloadBits: Record<string, PayloadBit>
}
