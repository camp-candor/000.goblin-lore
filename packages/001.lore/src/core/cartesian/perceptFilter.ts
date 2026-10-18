import {
    LocalSensoryLedger,
    SensoryPerceptRecord,
} from '../../db/localSensoryLedger'

export interface DialogueBeatInput {
    beat_id: string
    speaker_id: string
    dialogue_text: string
    camera_parenthetical: string
    observable_parenthetical: string
    referenced_entities: string[]
}

export interface SanitizedContextEnvelope {
    actor_id: string
    scene_id: string
    tick: number
    authorized_percepts: Array<{
        modality: string
        apparent_source: string
        description: string
        quality_score: number
    }>
    forbidden_entities: string[]
}

export class PerceptFilter {
    constructor(private ledger: LocalSensoryLedger) {}

    /**
     * Applies Somatic Acuity rules to filter candidate sensory evidence.
     */
    public evaluateSensoryReception(
        observerId: string,
        modality: 'VISUAL' | 'AUDITORY',
        sourceBearingHex: number | null,
        distanceSteps: number,
        rawSignalCdB: number,
    ): { received: boolean; qualityPermille: number; reason?: string } {
        const profile = this.ledger.getSensoryProfile(observerId)
        if (!profile || profile.is_unconscious) {
            return {
                received: false,
                qualityPermille: 0,
                reason: 'OBSERVER_INCAPACITATED',
            }
        }

        if (modality === 'VISUAL') {
            if (profile.visual_acuity === 'BLIND') {
                return {
                    received: false,
                    qualityPermille: 0,
                    reason: 'SOMATIC_OPTICAL_BLINDNESS',
                }
            }

            if (profile.visual_acuity === 'MONOCULAR') {
                // Range clamped to 50%
                if (distanceSteps > 3) {
                    return {
                        received: false,
                        qualityPermille: 0,
                        reason: 'MONOCULAR_RANGE_CUTOFF',
                    }
                }
                // Check facing cone (must be within forward 120 degrees: facing +/- 1)
                if (
                    profile.facing_direction !== null &&
                    profile.facing_direction !== undefined &&
                    sourceBearingHex !== null
                ) {
                    const diff = Math.abs(
                        profile.facing_direction - sourceBearingHex,
                    )
                    const angularDist = Math.min(diff, 6 - diff)
                    if (angularDist > 1) {
                        return {
                            received: false,
                            qualityPermille: 0,
                            reason: 'MONOCULAR_BLIND_SECTOR',
                        }
                    }
                }
            }

            // Linear distance quality drop
            const quality = Math.max(100, 1000 - distanceSteps * 150)
            return { received: true, qualityPermille: quality }
        }

        if (modality === 'AUDITORY') {
            let threshold = profile.hearing_threshold_cdb
            if (profile.has_acoustic_trauma) {
                threshold += 1500 // Requires +15 dB intensity to perceive
            }

            if (rawSignalCdB < threshold) {
                return {
                    received: false,
                    qualityPermille: 0,
                    reason: 'BELOW_HEARING_THRESHOLD',
                }
            }

            const quality = Math.min(
                1000,
                Math.max(200, (rawSignalCdB - threshold) * 2),
            )
            return { received: true, qualityPermille: quality }
        }

        return {
            received: false,
            qualityPermille: 0,
            reason: 'UNSUPPORTED_MODALITY',
        }
    }

    /**
     * Enforces Ignorance by Omission: builds the sanitized prompt envelope
     * containing ONLY what the actor has verified percepts for.
     */
    public buildSanitizedContextEnvelope(
        actorId: string,
        sceneId: string,
        tick: number,
        globalSecretEntityIds: string[] = [],
    ): SanitizedContextEnvelope {
        const verifiedPercepts = this.ledger.getObserverPercepts(actorId, tick)
        const observedEntities = new Set<string>()

        for (const p of verifiedPercepts) {
            if (p.apparent_source_id) {
                observedEntities.add(p.apparent_source_id)
            }
        }

        // Entities the actor is completely ignorant of
        const forbiddenEntities = globalSecretEntityIds.filter(
            (id) => !observedEntities.has(id),
        )

        const authorizedPercepts = verifiedPercepts.map((p) => ({
            modality: p.modality,
            apparent_source: p.apparent_source_id || 'AMBIENT_ENVIRONMENT',
            description: p.is_resolved
                ? `Direct observation of ${p.apparent_source_id} via ${p.modality}`
                : `Unresolved sensory cue from ${p.apparent_location_id} via ${p.modality}`,
            quality_score: p.quality_score,
        }))

        return {
            actor_id: actorId,
            scene_id: sceneId,
            tick,
            authorized_percepts: authorizedPercepts,
            forbidden_entities: forbiddenEntities,
        }
    }

    /**
     * Micro-tell Downgrade: if optical quality < 700, downgrade fine autonomic tells
     * into neutral gross motor actions while preserving optical camera staging.
     */
    public filterDialogueMicroTells(
        beat: DialogueBeatInput,
        observerId: string,
    ): {
        observable_parenthetical: string
        camera_parenthetical: string
        wasDowngraded: boolean
    } {
        const percepts = this.ledger.getObserverPercepts(observerId)
        const speakerPercept = percepts.find(
            (p) =>
                p.apparent_source_id === beat.speaker_id &&
                p.modality === 'VISUAL',
        )

        const quality = speakerPercept ? speakerPercept.quality_score : 0

        // High quality: observer sees fine micro-tells directly
        if (quality >= 700) {
            return {
                observable_parenthetical: beat.observable_parenthetical,
                camera_parenthetical: beat.camera_parenthetical,
                wasDowngraded: false,
            }
        }

        // Low quality (< 700) or obstructed: sanitize micro-tells (eyes darting, sweating, shaking)
        const sanitizedAction = beat.observable_parenthetical
            .replace(/knuckles\s+white/gi, 'holding hands low')
            .replace(
                /eyes\s+(?:darting|widening|narrowing)/gi,
                'looking forward',
            )
            .replace(/trembling|shaking/gi, 'standing still')
            .replace(/sweating|beads\s+of\s+sweat/gi, 'unreadable posture')

        return {
            observable_parenthetical: sanitizedAction,
            camera_parenthetical: beat.camera_parenthetical, // Retained intact for optical Remotion layer
            wasDowngraded: sanitizedAction !== beat.observable_parenthetical,
        }
    }

    /**
     * Compile-Time Omniscience Gate:
     * Halts with CARTESIAN_FIREWALL_BREACH if dialogue mentions forbidden entities.
     */
    public auditDraftForOmniscience(
        beat: DialogueBeatInput,
        envelope: SanitizedContextEnvelope,
    ): { valid: boolean; breachEntity?: string } {
        const textLower =
            `${beat.dialogue_text} ${beat.observable_parenthetical}`.toLowerCase()

        for (const forbidden of envelope.forbidden_entities) {
            const token = forbidden
                .toLowerCase()
                .replace(/^(?:item_|char_|loc_|event_)/, '')
                .replace(/_/g, ' ')
            if (textLower.includes(token)) {
                return { valid: false, breachEntity: forbidden }
            }
        }

        return { valid: true }
    }
}
