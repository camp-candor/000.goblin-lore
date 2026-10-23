import Relation, {
    RelationVerificationErrorBit,
} from './fce/relation.interface'
import { CharacterRelationProfile } from './val/relation.val'

export class RelationModel implements Relation {
    idx: string = '25.relation.unit'
    profiles: Record<string, CharacterRelationProfile> = {}
    errors: RelationVerificationErrorBit[] = []
}
