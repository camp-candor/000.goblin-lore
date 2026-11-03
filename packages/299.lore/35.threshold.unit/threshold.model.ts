import Threshold from './fce/threshold.interface.js'
import type { PostBreakReceipt } from './val/postBreak.val.js'

export class ThresholdModel implements Threshold {
    idx: string = '35.threshold'
    breakReceipts: Record<string, PostBreakReceipt> = {}
    brokenEntities: Set<string> = new Set<string>()
}

export default ThresholdModel
