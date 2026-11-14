import { z } from 'zod'
import { SignificantEventCategorySchema } from './autoScriptRule.interface.js'

export const DaypartBandSchema = z.enum([
    'DAWN',
    'MORNING',
    'AFTERNOON',
    'DUSK',
    'NIGHT',
])

export type DaypartBand = z.infer<typeof DaypartBandSchema>

export const isGregorianLeapYearLocal = (year: number): boolean => {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

export const daysInGregorianMonthLocal = (
    year: number,
    month: number,
): number => {
    if (month === 2) return isGregorianLeapYearLocal(year) ? 29 : 28
    if (month === 4 || month === 6 || month === 9 || month === 11) return 30
    return 31
}

export const isValidGregorianIsoDate = (isoDate: string): boolean => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
    if (!m) return false
    const year = Number(m[1])
    const month = Number(m[2])
    const day = Number(m[3])
    if (month < 1 || month > 12) return false
    const maxDay = daysInGregorianMonthLocal(year, month)
    if (day < 1 || day > maxDay) return false
    return true
}

export const WeekdayTokenSchema = z.enum([
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT',
    'SUN',
])
export type WeekdayToken = z.infer<typeof WeekdayTokenSchema>

export const LunarPhaseTokenSchema = z.enum([
    'NEW_MOON',
    'FIRST_QUARTER',
    'FULL_MOON',
    'LAST_QUARTER',
])
export type LunarPhaseToken = z.infer<typeof LunarPhaseTokenSchema>

export const SolarMarkerTokenSchema = z.enum([
    'VERNAL_EQUINOX',
    'SUMMER_SOLSTICE',
    'AUTUMN_EQUINOX',
    'WINTER_SOLSTICE',
])
export type SolarMarkerToken = z.infer<typeof SolarMarkerTokenSchema>

export const BlackoutShiftPolicySchema = z.enum([
    'SKIP',
    'DEFER_NEXT_VALID_DAY',
])
export type BlackoutShiftPolicy = z.infer<typeof BlackoutShiftPolicySchema>

export const RecurrenceFrequencySchema = z.enum([
    'ONCE',
    'DAILY',
    'WEEKLY_MASK',
    'INTERVAL_DAYS',
    'LUNAR_PHASE',
    'SOLAR_SOLSTICE_EQUINOX',
])
export type RecurrenceFrequency = z.infer<typeof RecurrenceFrequencySchema>

export const RecurrenceRuleSchema = z
    .object({
        frequency: RecurrenceFrequencySchema,
        weekdayMask: z.array(WeekdayTokenSchema).min(1).max(7).optional(),
        intervalDays: z.number().int().min(1).max(365).optional(),
        lunarPhase: LunarPhaseTokenSchema.optional(),
        solarMarkers: z.array(SolarMarkerTokenSchema).min(1).max(4).optional(),
        blackoutDates: z
            .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
            .max(128)
            .default([]),
        blackoutWeekdays: z.array(WeekdayTokenSchema).max(6).default([]),
        blackoutShiftPolicy: BlackoutShiftPolicySchema.default('SKIP'),
        untilIsoDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
        maxOccurrences: z.number().int().min(1).max(1000).optional(),
    })
    .strict()
    .superRefine((rule, ctx) => {
        if (
            rule.frequency === 'WEEKLY_MASK' &&
            (!rule.weekdayMask || rule.weekdayMask.length === 0)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    '[RECURRENCE_MISSING_WEEKDAY_MASK] WEEKLY_MASK requires non-empty weekdayMask',
                path: ['weekdayMask'],
            })
        }
        if (
            rule.frequency === 'INTERVAL_DAYS' &&
            (rule.intervalDays === undefined || rule.intervalDays === null)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    '[RECURRENCE_MISSING_INTERVAL_DAYS] INTERVAL_DAYS requires intervalDays',
                path: ['intervalDays'],
            })
        }
        if (
            rule.frequency === 'LUNAR_PHASE' &&
            (rule.lunarPhase === undefined || rule.lunarPhase === null)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    '[RECURRENCE_MISSING_LUNAR_PHASE] LUNAR_PHASE requires lunarPhase',
                path: ['lunarPhase'],
            })
        }
        if (
            rule.frequency === 'SOLAR_SOLSTICE_EQUINOX' &&
            (!rule.solarMarkers || rule.solarMarkers.length === 0)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    '[RECURRENCE_MISSING_SOLAR_MARKERS] SOLAR_SOLSTICE_EQUINOX requires non-empty solarMarkers',
                path: ['solarMarkers'],
            })
        }
        for (let i = 0; i < (rule.blackoutDates ?? []).length; i++) {
            const d = (rule.blackoutDates ?? [])[i]
            if (!isValidGregorianIsoDate(d)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `[INVALID_BLACKOUT_DATE] Invalid blackout date: ${d}`,
                    path: ['blackoutDates', i],
                })
            }
        }
        if (
            rule.untilIsoDate !== undefined &&
            !isValidGregorianIsoDate(rule.untilIsoDate)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `[INVALID_UNTIL_DATE] Invalid untilIsoDate: ${rule.untilIsoDate}`,
                path: ['untilIsoDate'],
            })
        }
    })

export type RecurrenceRule = z.infer<typeof RecurrenceRuleSchema>

export const normalizeBeatRecurrenceRule = (
    beat: ScheduledBeat | Record<string, unknown>,
): RecurrenceRule => {
    const candidate = (beat as Record<string, unknown>)?.['recurrenceRule'] as
        RecurrenceRule | undefined
    if (candidate !== undefined && candidate !== null) {
        return candidate
    }
    const recurringDaily =
        (beat as Record<string, unknown>)?.['recurringDaily'] === true
    if (recurringDaily) {
        return {
            frequency: 'DAILY',
            blackoutDates: [],
            blackoutWeekdays: [],
            blackoutShiftPolicy: 'SKIP',
        }
    }
    return {
        frequency: 'ONCE',
        blackoutDates: [],
        blackoutWeekdays: [],
        blackoutShiftPolicy: 'SKIP',
    }
}

export const ScheduledBeatSchema = z
    .object({
        beat_id: z.string().regex(/^[a-z0-9_]+$/),
        title: z.string().min(1).max(120),
        isoDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTimeHm: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        beatCategory: SignificantEventCategorySchema,
        reserveCooldownTicks: z.number().int().min(0).max(1000).default(2),
        priorityBps: z.number().int().min(0).max(10000).default(9500),
        locationId: z
            .string()
            .regex(/^loc_[a-z0-9_]+$/)
            .optional(),
        participantIds: z
            .array(z.string().regex(/^char_[a-z0-9_]+$/))
            .max(16)
            .optional(),
        recurringDaily: z.boolean().default(false),
        toleranceTicks: z.number().int().min(0).max(10).default(0),
        recurrenceRule: RecurrenceRuleSchema.optional(),
    })
    .strict()
    .superRefine((beat, ctx) => {
        if (!isValidGregorianIsoDate(beat.isoDate)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `[INVALID_AGENDA_DATE] Invalid calendar date: ${beat.isoDate}`,
                path: ['isoDate'],
            })
        }
        const until = (beat as { recurrenceRule?: { untilIsoDate?: string } })
            ?.recurrenceRule?.untilIsoDate
        if (typeof until === 'string' && until < beat.isoDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `[RECURRENCE_UNTIL_BEFORE_START] untilIsoDate ${until} precedes beat isoDate ${beat.isoDate}`,
                path: ['recurrenceRule', 'untilIsoDate'],
            })
        }
    })

export type ScheduledBeat = z.infer<typeof ScheduledBeatSchema>

export const ChronoAgendaRegistrySchema = z.array(ScheduledBeatSchema).max(256)
export type ChronoAgendaRegistry = z.infer<typeof ChronoAgendaRegistrySchema>

export const sortScheduledBeatsDeterministically = (
    beats: ScheduledBeat[],
): ScheduledBeat[] => {
    const copy = [...beats]
    copy.sort((a, b) => {
        if (a.isoDate < b.isoDate) return -1
        if (a.isoDate > b.isoDate) return 1
        if (a.startTimeHm < b.startTimeHm) return -1
        if (a.startTimeHm > b.startTimeHm) return 1
        if (a.beat_id < b.beat_id) return -1
        if (a.beat_id > b.beat_id) return 1
        return 0
    })
    return copy
}

export const ChronologyConfigSchema = z
    .object({
        calendar_system: z.literal('GREGORIAN_24H').default('GREGORIAN_24H'),
        start_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must match YYYY-MM-DD')
            .default('2026-10-31'),
        start_time: z
            .string()
            .regex(
                /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
                'Must match HH:MM or HH:MM:SS',
            )
            .default('21:00:00'),
        tick_seconds: z.number().int().min(1).max(86400).default(60),
        frames_per_second: z.number().int().min(1).max(120).default(24),
        timezone_label: z.string().min(1).max(32).default('UTC+00:00'),
        era_label: z.string().min(1).max(64).default('CANON_PRESENT'),
        scheduled_beats: z.array(ScheduledBeatSchema).max(256).optional(),
        series_blackout_dates: z
            .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
            .max(256)
            .optional(),
    })
    .strict()
    .superRefine((val, ctx) => {
        if (!isValidGregorianIsoDate(val.start_date)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `[INVALID_CALENDAR_DATE] Invalid calendar start_date: ${val.start_date}`,
                path: ['start_date'],
            })
        }
        for (
            let i = 0;
            i <
            (
                (val as { series_blackout_dates?: string[] })
                    .series_blackout_dates ?? []
            ).length;
            i++
        ) {
            const d = ((val as { series_blackout_dates?: string[] })
                .series_blackout_dates ?? [])[i]
            if (!isValidGregorianIsoDate(d)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `[INVALID_BLACKOUT_DATE] Invalid series_blackout_dates entry: ${d}`,
                    path: ['series_blackout_dates', i],
                })
            }
        }
        const beats = val.scheduled_beats ?? []
        const seen = new Set<string>()
        for (let i = 0; i < beats.length; i++) {
            const id = beats[i].beat_id
            if (seen.has(id)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `[DUPLICATE_AGENDA_BEAT_ID] Duplicate beat_id: ${id}`,
                    path: ['scheduled_beats', i, 'beat_id'],
                })
            } else {
                seen.add(id)
            }
        }
    })

export type ChronologyConfig = z.infer<typeof ChronologyConfigSchema>

export interface AgendaBeatTickOffset {
    readonly beat_id: string
    readonly isoDate: string
    readonly startTimeHm: string
    readonly beatCategory: string
    readonly deltaSeconds: number
    readonly targetTick: number
    readonly reserveStartTick: number
    readonly reserveCooldownTicks: number
    readonly valid: boolean
    readonly errorCode?: string
}

export interface AgendaReserveOverlap {
    readonly prevBeatId: string
    readonly nextBeatId: string
    readonly prevTargetTick: number
    readonly nextReserveStartTick: number
}

export interface ChronoAgendaValidation {
    readonly valid: boolean
    readonly errors: string[]
    readonly resolvedBeats: AgendaBeatTickOffset[]
    readonly overlaps: AgendaReserveOverlap[]
}

export interface CalendarClockSnapshot {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    second: number
    centisecond: number
    tickCount: number
    tickSeconds: number
    framesPerSecond: number
    totalElapsedSeconds: number
    totalFrames: number
    isoDate: string
    clockTimeHm: string
    clockTimeHms: string
    timecodeSmpte: string
    daypart: DaypartBand
    timezoneLabel: string
    eraLabel: string
}

export const DEFAULT_CHRONOLOGY_CONFIG: Readonly<ChronologyConfig> =
    Object.freeze({
        calendar_system: 'GREGORIAN_24H',
        start_date: '2026-10-31',
        start_time: '21:00:00',
        tick_seconds: 60,
        frames_per_second: 24,
        timezone_label: 'UTC+00:00',
        era_label: 'CANON_PRESENT',
    })

export const normalizeClockTimeHms = (rawTime: string): string => {
    const trimmed = String(rawTime || '00:00:00').trim()
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
        return `${trimmed}:00`
    }
    if (/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(trimmed)) {
        return trimmed
    }
    throw new Error(`INVALID_START_TIME:${trimmed}`)
}

export const resolveChronologyConfig = (
    input?: Partial<ChronologyConfig> | null,
): ChronologyConfig => {
    const parsed = ChronologyConfigSchema.parse(input ?? {})
    return {
        ...parsed,
        start_time: normalizeClockTimeHms(parsed.start_time),
    }
}

export const resolveSeriesChronology = (config?: any): ChronologyConfig => {
    return resolveChronologyConfig(config?.chronology ?? config)
}
