import type Logistic from './fce/logistic.interface.js'
import type {
    CharacterLogisticalVector,
    PossessionLogisticalVector,
} from './val/logistic.val.js'

export class LogisticModel implements Logistic {
    idx: string = '04.logistic'
    characterVectors: Record<string, CharacterLogisticalVector> = {}
    possessionCatalog: Record<string, PossessionLogisticalVector> = {}
}
