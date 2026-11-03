import type {
    ConditionRegistryEntry,
    WorldConditionsFrontmatter,
} from '../val/conditionsRegistry.val.js'

export default interface ConditionRegistryEntryBit extends Readonly<ConditionRegistryEntry> {}
export interface WorldConditionsCatalogBit extends Readonly<WorldConditionsFrontmatter> {}
