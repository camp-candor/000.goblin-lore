import type Status from './fce/status.interface.js'
import type StatusBit from './fce/status.bit.js'

export class StatusModel implements Status {
  idx: string = '32.status'
  statusBitList: StatusBit[] = []
  statusBits: Record<string, StatusBit> = {}
}
