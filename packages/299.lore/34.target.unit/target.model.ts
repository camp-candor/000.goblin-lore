import type Target from './fce/target.interface.js'
import type { EntityCountRecord } from './fce/targetSeries.bit.js'

export class TargetModel implements Target {
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
}
