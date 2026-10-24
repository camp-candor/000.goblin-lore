export {
    initSeries,
    updateSeries,
    resolveArchetype,
} from './buz/series.buzz.js'
export { validateSeriesSlug, assertSeriesSlug } from './buz/seriesSlug.buzz.js'
export {
    sanitizeSeriesSlug,
    SeriesSlugSchema,
    SERIES_SLUG_MIN_LENGTH,
    SERIES_SLUG_MAX_LENGTH,
    SERIES_SLUG_REGEX,
} from './val/seriesSlug.val.js'
export {
    assertSeriesNamespaceVacant,
    checkSeriesSlugAvailabilityBuzz,
} from './buz/slugCollisionGuard.buzz.js'
export { writeSeriesConfig } from './buz/writeSeriesConfig.buzz.js'
export { scaffoldSeriesTree } from './buz/scaffoldSeriesTree.buzz.js'
