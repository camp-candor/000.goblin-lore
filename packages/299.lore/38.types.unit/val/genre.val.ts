import { z } from 'zod'

export const VALID_GENRE_CLASSIFICATIONS = [
    'LOW_FANTASY_FARCE',
    'STANDARD',
    'SUPERHERO_URBAN_VIGILANTE',
    'SOUTHERN_GOTHIC_INDUSTRIAL',
    'HARD_SCIFI_VACUUM',
] as const

export const GenreClassificationEnum = z.enum(VALID_GENRE_CLASSIFICATIONS)

export type GenreClassification = z.infer<typeof GenreClassificationEnum>

export type ModalChamberFocus =
    'ALETHIC' | 'DEONTIC' | 'AXIOLOGICAL' | 'EPISTEMIC'

export interface GenreTaxonomyProfile {
    readonly id: GenreClassification
    readonly label: string
    readonly tone_bps: number
    readonly physics_bps: number
    readonly pacing_bps: number
    readonly primary_modal_chamber: ModalChamberFocus
    readonly secondary_modal_chamber: ModalChamberFocus
    readonly default_max_farce_ratio_bps: number
    readonly default_acoustic_floor_cdb: number
}

export const GENRE_TAXONOMY_PROFILES: Readonly<
    Record<GenreClassification, GenreTaxonomyProfile>
> = Object.freeze({
    LOW_FANTASY_FARCE: {
        id: 'LOW_FANTASY_FARCE',
        label: '[1] LOW FANTASY FARCE (Grim Friction / Crawlspace)',
        tone_bps: 7500,
        physics_bps: 9000,
        pacing_bps: 6500,
        primary_modal_chamber: 'ALETHIC',
        secondary_modal_chamber: 'AXIOLOGICAL',
        default_max_farce_ratio_bps: 1500,
        default_acoustic_floor_cdb: 1500,
    },
    STANDARD: {
        id: 'STANDARD',
        label: '[2] STANDARD DRAMATIC REALISM (Grounded Baseline)',
        tone_bps: 5000,
        physics_bps: 8500,
        pacing_bps: 6000,
        primary_modal_chamber: 'AXIOLOGICAL',
        secondary_modal_chamber: 'EPISTEMIC',
        default_max_farce_ratio_bps: 1000,
        default_acoustic_floor_cdb: 1800,
    },
    SUPERHERO_URBAN_VIGILANTE: {
        id: 'SUPERHERO_URBAN_VIGILANTE',
        label: '[3] SUPERHERO URBAN VIGILANTE (Power / Duty / Masquerade)',
        tone_bps: 4500,
        physics_bps: 6250,
        pacing_bps: 8000,
        primary_modal_chamber: 'ALETHIC',
        secondary_modal_chamber: 'DEONTIC',
        default_max_farce_ratio_bps: 1000,
        default_acoustic_floor_cdb: 2200,
    },
    SOUTHERN_GOTHIC_INDUSTRIAL: {
        id: 'SOUTHERN_GOTHIC_INDUSTRIAL',
        label: '[4] SOUTHERN GOTHIC INDUSTRIAL (Rot / Bloodline / Heat)',
        tone_bps: 7500,
        physics_bps: 8500,
        pacing_bps: 3500,
        primary_modal_chamber: 'AXIOLOGICAL',
        secondary_modal_chamber: 'DEONTIC',
        default_max_farce_ratio_bps: 1200,
        default_acoustic_floor_cdb: 1600,
    },
    HARD_SCIFI_VACUUM: {
        id: 'HARD_SCIFI_VACUUM',
        label: '[5] HARD SCIFI VACUUM (Orbital Mechanics / Scarcity)',
        tone_bps: 8000,
        physics_bps: 9500,
        pacing_bps: 5000,
        primary_modal_chamber: 'ALETHIC',
        secondary_modal_chamber: 'EPISTEMIC',
        default_max_farce_ratio_bps: 500,
        default_acoustic_floor_cdb: 1000,
    },
})

export function validateGenreClassification(raw: unknown): GenreClassification {
    return GenreClassificationEnum.parse(raw)
}

export function resolveGenreProfile(
    genre: GenreClassification,
): GenreTaxonomyProfile {
    return GENRE_TAXONOMY_PROFILES[genre]
}
