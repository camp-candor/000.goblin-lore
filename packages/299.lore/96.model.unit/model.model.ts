import ModelInterface from './fce/model.interface.js'
import ModelBit from './fce/model.bit.js'
import { FactScope } from '../38.types.unit/val/scope.val.js'
import { AuthorityLevel } from '../38.types.unit/val/authority.val.js'
import { FactNodeBit, DeepReadonly } from './fce/model.bit.js'

export class ModelModel implements ModelInterface {
    idx: string = ''
    modelBits: Record<string, ModelBit> = {}
}

/**
 * Singleton State Store for 96.model.unit.
 * Encapsulates in-memory maps, secondary indexes, and validation telemetry.
 */
export class FactRegistryModel {
    public facts: Map<string, DeepReadonly<FactNodeBit>> = new Map()
    public factsByScope: Map<FactScope, Set<string>> = new Map()
    public factsByAuthority: Map<AuthorityLevel, Set<string>> = new Map()
    public lastSchemaErrors: string[] = []

    constructor() {
        this.reset()
    }

    public reset(): void {
        this.facts.clear()
        this.factsByScope = new Map<FactScope, Set<string>>([
            ['CHARACTER', new Set()],
            ['LOCATION', new Set()],
            ['LOGISTIC', new Set()],
            ['LAW', new Set()],
        ])
        this.factsByAuthority = new Map<AuthorityLevel, Set<string>>([
            ['AXIOM', new Set()],
            ['CANON', new Set()],
            ['EVENT', new Set()],
            ['RUNTIME_STATE', new Set()],
            ['PROJECTION', new Set()],
            ['SPECULATION', new Set()],
        ])
        this.lastSchemaErrors = []
    }
}

export const Model = new FactRegistryModel()
