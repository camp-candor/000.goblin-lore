import type {
    CharacterLogisticalVector,
    PossessionLogisticalVector,
} from '../val/logistic.val.js'

export default interface Logistic {
    idx: string
    characterVectors: Record<string, CharacterLogisticalVector>
    possessionCatalog: Record<string, PossessionLogisticalVector>
}
