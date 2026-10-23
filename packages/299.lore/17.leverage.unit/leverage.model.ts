import Leverage, {
    LeverageVerificationErrorBit,
} from './fce/leverage.interface'
import {
    StringsLedgerRecord,
    CharacterLeverageVector,
} from './val/leverage.val'

export class LeverageModel implements Leverage {
    idx: string = '17.leverage.unit'
    records: Record<string, StringsLedgerRecord> = {}
    character_vectors: Record<string, CharacterLeverageVector> = {}
    errors: LeverageVerificationErrorBit[] = []
}
