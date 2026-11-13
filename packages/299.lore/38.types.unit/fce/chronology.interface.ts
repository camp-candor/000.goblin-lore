import { z } from 'zod'

export const DaypartBandSchema = z.enum([
    'DAWN',
    'MORNING',
    'AFTERNOON',
    'DUSK',
    'NIGHT',
])

export type DaypartBand = z.infer<typeof DaypartBandSchema>

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
    })
    .strict()

export type ChronologyConfig = z.infer<typeof ChronologyConfigSchema>

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
