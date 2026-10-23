import type Trauma from './fce/trauma.interface'
import type { SensoryAcuityProfile } from './val/sensory.val'
import type { VocalDspModifierProfile } from './val/vocalDsp.val'
import type { SomaticTraumaReceipt } from './val/somaticDelta.val'

export class TraumaModel implements Trauma {
    idx = '37.trauma'
    sensoryProfiles: Record<string, SensoryAcuityProfile> = {}
    vocalDspProfiles: Record<string, VocalDspModifierProfile> = {}
    somaticStates: Record<string, SomaticTraumaReceipt> = {}
}
