import type { SensoryAcuityProfile } from '../val/sensory.val'
import type { VocalDspModifierProfile } from '../val/vocalDsp.val'
import type { SomaticTraumaReceipt } from '../val/somaticDelta.val'

export interface TraumaRecord {
    traumaId: string
    conditionTag: string
    intensityBps: number
}

export default interface Trauma {
    idx: string
    sensoryProfiles: Record<string, SensoryAcuityProfile>
    vocalDspProfiles: Record<string, VocalDspModifierProfile>
    somaticStates: Record<string, SomaticTraumaReceipt>
}
