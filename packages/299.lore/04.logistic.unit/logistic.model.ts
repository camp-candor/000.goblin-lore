import Logistic from './fce/logistic.interface'
import {
    CharacterLogisticalVector,
    PossessionLogisticalVector,
} from './val/logistic.val'

export class LogisticModel implements Logistic {
    idx: string = '04.logistic.unit'
    characters: Record<string, CharacterLogisticalVector> = {}
    possessions: Record<string, PossessionLogisticalVector> = {}
}
