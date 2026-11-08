import type EscalationBit from './escalation.bit.js'

export default interface Escalation {
    idx: string
    escalationBitList: EscalationBit[]
    escalationBits: Record<string, EscalationBit>
}
