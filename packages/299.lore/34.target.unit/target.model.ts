import type Target from './fce/target.interface.js'
import type { EntityCountRecord } from './fce/targetSeries.bit.js'
import type { EntityGraphNodeBit, TargetDomain } from './fce/target.bit.js'

export class TargetModel implements Target {
    private static instance: TargetModel

    idx: string = 'tar00'
    activeSeriesSlug: string | null = null
    activeSeriesConfig: Readonly<Record<string, any>> | null = null
    activeMerkleRoot: string | null = null
    entityCounts: EntityCountRecord = {
        characters: 0,
        locations: 0,
        possessions: 0,
        grievances: 0,
        total: 0,
    }
    themeColor: 'green' | 'yellow' | 'cyan' = 'yellow'
    sowerEngineSynced: boolean = false

    private nodes: Map<string, EntityGraphNodeBit> = new Map()
    private domainIndices: Map<TargetDomain, Set<string>> = new Map([
        ['character', new Set()],
        ['location', new Set()],
        ['possession', new Set()],
        ['grievance', new Set()],
        ['world', new Set()],
    ])

    public constructor() {}

    public static getInstance(): TargetModel {
        if (!TargetModel.instance) {
            TargetModel.instance = new TargetModel()
        }
        return TargetModel.instance
    }

    public clear(): void {
        this.nodes.clear()
        for (const key of this.domainIndices.keys()) {
            this.domainIndices.get(key)!.clear()
        }
    }

    public registerNode(node: EntityGraphNodeBit): void {
        this.nodes.set(node.id, node)
        if (this.domainIndices.has(node.domain)) {
            this.domainIndices.get(node.domain)!.add(node.id)
        }
    }

    public getNode(id: string): EntityGraphNodeBit | undefined {
        return this.nodes.get(id)
    }

    public hasNode(id: string): boolean {
        return this.nodes.has(id)
    }

    public getIdsByDomain(domain: TargetDomain): string[] {
        const ids = this.domainIndices.get(domain)
        return ids ? Array.from(ids) : []
    }

    public getAllNodes(): EntityGraphNodeBit[] {
        return Array.from(this.nodes.values())
    }

    public getDomainCounts(): Record<TargetDomain, number> {
        return {
            character: this.domainIndices.get('character')?.size ?? 0,
            location: this.domainIndices.get('location')?.size ?? 0,
            possession: this.domainIndices.get('possession')?.size ?? 0,
            grievance: this.domainIndices.get('grievance')?.size ?? 0,
            world: this.domainIndices.get('world')?.size ?? 0,
        }
    }
}
