import type Escalation from './fce/escalation.interface.js'
import type EscalationBit from './fce/escalation.bit.js'

export class EscalationModel implements Escalation {
    idx: string = '10.escalation'
    escalationBitList: EscalationBit[] = []
    escalationBits: Record<string, EscalationBit> = {}
}
