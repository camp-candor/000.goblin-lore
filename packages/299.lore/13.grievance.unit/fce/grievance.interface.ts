import type GrievanceBit from './grievance.bit.js'

export default interface Grievance {
    idx: string
    grievanceBitList: GrievanceBit[]
    grievanceBits: Record<string, GrievanceBit>
}
