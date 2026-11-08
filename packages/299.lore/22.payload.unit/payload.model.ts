import type Payload from './fce/payload.interface.js'
import type PayloadBit from './fce/payload.bit.js'

export class PayloadModel implements Payload {
  idx: string = '22.payload'
  payloadBitList: PayloadBit[] = []
  payloadBits: Record<string, PayloadBit> = {}
}
