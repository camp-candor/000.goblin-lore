import type Series from './fce/series.interface.js'
import type SeriesBit from './fce/series.bit.js'
import {
    type SomaticArchetype,
    DEFAULT_ARCHETYPES,
} from './val/archetype.val.js'

export interface SeriesModelState {
    activeSeriesSlug: string | null
    activeSeriesPath: string | null
    repoRootPath: string | null
}

export class SeriesModel implements Series {
    idx: string = '29.series.unit'
    seriesBitList: SeriesBit[] = []
    seriesBits: Record<string, any> = {}
    archetypeRegistry: Record<string, SomaticArchetype> = {
        ...DEFAULT_ARCHETYPES,
    }

    private static instance: SeriesModel
    private state: SeriesModelState = {
        activeSeriesSlug: null,
        activeSeriesPath: null,
        repoRootPath: null,
    }

    constructor() {}

    public static getInstance(): SeriesModel {
        if (!SeriesModel.instance) {
            SeriesModel.instance = new SeriesModel()
        }
        return SeriesModel.instance
    }

    public getState(): Readonly<SeriesModelState> {
        return Object.freeze({ ...this.state })
    }

    public setActiveSeries(
        slug: string,
        seriesPath: string,
        repoRoot: string,
    ): void {
        this.state.activeSeriesSlug = slug
        this.state.activeSeriesPath = seriesPath
        this.state.repoRootPath = repoRoot
    }

    public reset(): void {
        this.state = {
            activeSeriesSlug: null,
            activeSeriesPath: null,
            repoRootPath: null,
        }
    }
}
