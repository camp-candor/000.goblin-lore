import type Verbs from './fce/verbs.interface'
import type { CompiledSomaticMask } from './val/verbs.val'
import type VerbsBit from './fce/verbs.bit'

export class VerbsModel implements Verbs {
    masksByEntity: Record<string, CompiledSomaticMask> = {}
    auditHistory: VerbsBit[] = []
}
