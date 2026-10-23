import type { CompiledSomaticMask } from '../val/verbs.val'
import type VerbsBit from './verbs.bit'

export default interface Verbs {
    masksByEntity: Record<string, CompiledSomaticMask>
    auditHistory: VerbsBit[]
}
