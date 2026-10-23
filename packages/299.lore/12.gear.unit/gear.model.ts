import Gear, { CharacterGearResolutionResultBit } from './fce/gear.interface'
import { PossessionDossierFrontmatter } from './val/gear.val'

export class GearModel implements Gear {
    idx: string = '12.gear.unit'
    catalog: Record<string, PossessionDossierFrontmatter> = {}
    allocations: Record<string, CharacterGearResolutionResultBit> = {}
}
