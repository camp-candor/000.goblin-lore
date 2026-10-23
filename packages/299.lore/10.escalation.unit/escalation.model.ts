import Escalation, {
    EscalationEvaluationResultBit,
} from './fce/escalation.interface'
import { CharacterConversationalProfile } from './val/escalation.val'

export class EscalationModel implements Escalation {
    idx: string = '10.escalation.unit'
    profiles: Record<string, CharacterConversationalProfile> = {}
    audit_history: EscalationEvaluationResultBit[] = []
}
