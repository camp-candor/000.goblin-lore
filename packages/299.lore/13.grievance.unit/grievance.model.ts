import type Grievance from './fce/grievance.interface.js'
import type GrievanceBit from './fce/grievance.bit.js'

export class GrievanceModel implements Grievance {
    idx: string = '13.grievance'
    grievanceBitList: GrievanceBit[] = []
    grievanceBits: Record<string, GrievanceBit> = {}
}
