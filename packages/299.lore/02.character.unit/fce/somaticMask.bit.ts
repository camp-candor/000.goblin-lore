/**
 * Sensory acuity configuration using integer basis points.
 */
export interface SensoryAcuityBit {
    readonly opticalState: 'NORMAL' | 'MONOCULAR' | 'BLIND'
    readonly blindConeDegrees: number
    readonly auditoryFloorDebuffCdB: number
}

/**
 * Vocal DSP modifiers using centitones and basis-point multipliers.
 */
export interface VocalDspModifierBit {
    readonly pitchShiftCentitones: number
    readonly speedMultiplierBps: number
    readonly pauseFrequencyBps: number
}

/**
 * Read-only compiled somatic capability projection.
 */
export interface CharacterSomaticMaskBit {
    readonly characterId: string
    readonly locomotionBaseline: string
    readonly availableArmsBps: number // 20000 = 2.0 arms, 10000 = 1.0 arm, 0 = 0 arms
    readonly bannedKineticVerbs: readonly string[]
    readonly motorLimitations: readonly string[]
    readonly conditions: readonly string[]
    readonly sensoryAcuity: SensoryAcuityBit
    readonly vocalDsp: VocalDspModifierBit
    readonly canSpeak: boolean
}

export default interface SomaticMaskBit {
    readonly idx: string
    readonly src?: string
    readonly val?: number
    readonly dat?: any
    readonly slv?: (res: any) => void
}
