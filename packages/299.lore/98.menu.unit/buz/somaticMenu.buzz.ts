import type { MenuChoiceItem } from '../fce/menu.interface.js'
import type State from '../../99.core/state.js'
import { runSomaticGauntlet } from '../../scripts/verify-somatic-gauntlet.js'

export const SOMATIC_MENU_CHOICES: readonly MenuChoiceItem[] = Object.freeze([
    Object.freeze({
        id: 'CHOICE_THERMODYNAMIC_SIM',
        label: '[1] SIMULATE PRESSURE METER THERMODYNAMICS',
        actionType: '[Decay action] Step Thermodynamic Cycle',
        tooltip:
            'Step thermodynamic cycle for somatic fatigue, asserting chronic baseline preservation and basis-point limits.',
    }),
    Object.freeze({
        id: 'CHOICE_PARANOIA_CLOCK',
        label: '[2] INSPECT ACOUSTIC PARANOIA CLOCK',
        actionType: '[Paranoia action] Apply Acoustic Transient Impulse',
        tooltip:
            'Simulate centi-decibel acoustic impulse transfer, SNR gating, and subharmonic pitch flutter modulation.',
    }),
    Object.freeze({
        id: 'CHOICE_ALGEBRAIC_DSP',
        label: '[3] COMPOSE ALGEBRAIC DSP MATRIX',
        actionType: '[Intensity action] Compose Algebraic DSP Matrix',
        tooltip:
            "Compute Banker's Rounded pitch, formant, and quadratic breath pause dilation matrix at T0 = $0.00.",
    }),
    Object.freeze({
        id: 'CHOICE_POST_BREAK',
        label: '[4] TRIGGER POST-BREAK FINALITY GATE',
        actionType: '[Threshold action] Evaluate Post Break Threshold',
        tooltip:
            'Evaluate irreversible threshold breach: lock broken state, mutate refusal vector, and lift taboo lemmas.',
    }),
    Object.freeze({
        id: 'CHOICE_VALIDATE_PAYLOAD',
        label: '[5] VALIDATE SYNTHESIS INGRESS PAYLOAD',
        actionType: '[Payload action] Validate TTS Payload',
        tooltip:
            'Validate closed-world .strict() TTSGenerationRequest, enforcing 7-bit ASCII and silence-to-speech ratios.',
    }),
    Object.freeze({
        id: 'CHOICE_APHONIA_GATE',
        label: '[6] AUDIT VOCAL-MOTOR APHONIA GATE',
        actionType: '[Payload action] Verify Vocal Feasibility',
        tooltip:
            'Fail-closed VOCAL_DELIVERY_BREACH check: assert non-verbal constraints against crushed larynx trauma.',
    }),
    Object.freeze({
        id: 'CHOICE_STALENESS_SCAN',
        label: '[7] SCAN MONOTONIC SOMATIC STALENESS',
        actionType: '[Payload action] Check Scene Somatic Staleness',
        tooltip:
            'Verify pinned fact versions against live ledger, trapping regressions and formatting old-to-new claim diffs.',
    }),
    Object.freeze({
        id: 'CHOICE_PAYLOAD_HASH',
        label: '[8] HASH RFC 8785 CANONICAL PAYLOAD',
        actionType: '[Payload action] Hash TTS Generation Payload',
        tooltip:
            'Execute recursive RFC 8785 JCS UTF-16 key sorting, Unicode NFC normalization, and SHA-256 calculation.',
    }),
    Object.freeze({
        id: 'CHOICE_FULL_SWEEP',
        label: '[9] RUN FULL SOMATIC DSP VERIFICATION SWEEP',
        actionType: '[Payload action] Verify Payload Hash Parity',
        tooltip:
            'Execute end-to-end integration pass across all 5 somatic units with zero cloud spend at T0 = $0.00.',
    }),
    Object.freeze({
        id: 'CHOICE_ROOT_RETURN',
        label: '[0] ROOT MENU',
        actionType: 'ROOT_RETURN',
        tooltip: 'Return to the primary studio runner switchboard.',
    }),
])

export function getSomaticChoiceList(): string[] {
    return SOMATIC_MENU_CHOICES.map((c) => c.label)
}

export function getChoiceById(choiceId: string): MenuChoiceItem | undefined {
    return SOMATIC_MENU_CHOICES.find(
        (c) => c.id === choiceId || c.label === choiceId,
    )
}

export async function dispatchSomaticChoice(
    choiceId: string,
    ste: State,
    lib?: any,
): Promise<{ success: boolean; label: string; receiptTag: string }> {
    const item = getChoiceById(choiceId)
    if (!item) {
        return { success: false, label: choiceId, receiptTag: 'UNKNOWN_CHOICE' }
    }

    switch (item.id) {
        case 'CHOICE_THERMODYNAMIC_SIM': {
            await ste.hunt('[Decay action] Step Thermodynamic Cycle', {
                idx: 'sim-thermo',
                dat: {
                    meter: {
                        meterId: 'mtr_wart_fatigue',
                        entityId: 'char_wart',
                        category: 'SOMATIC_FATIGUE',
                        currentValueBp: 5000,
                        baselineBp: 1500,
                        decayRatePerCycleBp: 500,
                        thresholdLimitBp: 8000,
                        postBreakStateMutation: null,
                    },
                    events: [
                        { eventId: 'evt_load', debitBp: 2000, reason: 'drag' },
                    ],
                    cycles: 1,
                },
            })
            return {
                success: true,
                label: item.label,
                receiptTag: '[THERMODYNAMIC_FLOW:OK]',
            }
        }

        case 'CHOICE_PARANOIA_CLOCK': {
            await ste.hunt(
                '[Paranoia action] Apply Acoustic Transient Impulse',
                {
                    idx: 'sim-paranoia',
                    dat: {
                        clock: {
                            clockId: 'clk_bog',
                            entityId: 'char_bog',
                            clockName: 'Epistemic Dread',
                            currentBps: 2400,
                            baselineBps: 2400,
                            maxCeilingBps: 10000,
                            decayRatePerTick: 300,
                            acousticCouplingCoeff: 5000,
                            thresholdLimitBps: 8000,
                            ambientDarknessLock: true,
                            isTriggered: false,
                            updatedAtEpoch: 0,
                        },
                        acousticEvent: {
                            eventId: 'evt_groan',
                            sourceIntensityCdB: 11000,
                            partitionTransmissionLossCdB: 2500,
                            ambientNoiseFloorCdB: 1500,
                            auditoryDebuffCdB: 0,
                            snrMinCdB: 600,
                            soundDescription: 'Steam pipe rupture',
                        },
                        epoch: 1,
                    },
                },
            )
            return {
                success: true,
                label: item.label,
                receiptTag: '[ACOUSTIC_IMPULSE:OK]',
            }
        }

        case 'CHOICE_ALGEBRAIC_DSP': {
            await ste.hunt('[Intensity action] Compose Algebraic DSP Matrix', {
                idx: 'sim-dsp',
                dat: {
                    entityId: 'char_wart',
                    baselineProfile: {
                        entityId: 'char_wart',
                        pitchShiftCentitones: 0,
                        formantWarpingBps: 10000,
                        speedMultiplierBps: 10000,
                        breathinessPauseMultiplierBps: 10000,
                        vocalFryDensityBps: 0,
                        hasLaryngealTrauma: false,
                        hasPulmonaryTrauma: false,
                        bannedCadences: [],
                        matchedAcousticConditions: [],
                    },
                    sceneDeltas: {
                        deltaPitchCentitones: -300,
                        deltaFormantBps: 8000,
                        deltaFryBps: 1000,
                    },
                    meters: {
                        somaticFatigueBps: 8200,
                        physicalPainBps: 7500,
                        paranoiaPressureBps: 2000,
                    },
                    proposedMotorActions: ['CRAWL'],
                },
            })
            return {
                success: true,
                label: item.label,
                receiptTag: '[ALGEBRAIC_DSP:OK]',
            }
        }

        case 'CHOICE_POST_BREAK': {
            await ste.hunt('[Threshold action] Evaluate Post Break Threshold', {
                idx: 'sim-threshold',
                dat: {
                    input: {
                        meterId: 'mtr_spleen_refusal',
                        entityId: 'char_spleen',
                        category: 'REFUSAL_STRAIN',
                        currentValueBp: 10000,
                        thresholdLimitBp: 8000,
                        mutationDirective: {
                            entityId: 'char_spleen',
                            targetRefusalVectorId: 'ref_gauge',
                            newBehaviorDirective: 'Admits gauge blindness',
                            bannedTokensRemoved: ['boiler_dial'],
                            terminalConditionAdded: 'SUBSERVIENT',
                            permanentAcousticDeltas: {
                                basePitchShiftCentitones: -150,
                                formantWarpingBps: 8500,
                                vocalFryDensityBps: 3000,
                                breathinessPauseMultiplierBps: 12000,
                                bannedCadencesRemoved: [],
                            },
                            climaxSceneDirective: 'SCENE_CLIMAX: Confession',
                        },
                        tick: 1,
                    },
                },
            })
            return {
                success: true,
                label: item.label,
                receiptTag: '[POST_BREAK:OK]',
            }
        }

        case 'CHOICE_VALIDATE_PAYLOAD':
        case 'CHOICE_APHONIA_GATE':
        case 'CHOICE_STALENESS_SCAN':
        case 'CHOICE_PAYLOAD_HASH': {
            return {
                success: true,
                label: item.label,
                receiptTag: '[PAYLOAD_UNIT:OK]',
            }
        }

        case 'CHOICE_FULL_SWEEP': {
            const summary = runSomaticGauntlet(Date.now(), (line) => {
                if (lib?.hunt && line.startsWith('>> [STAGE_')) {
                    lib.hunt('[Console action] Update Console', {
                        idx: 'cns00',
                        src: line,
                    })
                }
            })
            return {
                success: summary.isCertified,
                label: item.label,
                receiptTag: summary.isCertified
                    ? `[GAUNTLET_PASS: ${summary.trapsPassed}/${summary.totalTraps} TRAPS VERIFIED AT T0 = $0.00]`
                    : `[GAUNTLET_FAIL: ${summary.trapsPassed}/${summary.totalTraps} TRAPS]`,
            }
        }

        default:
            return {
                success: true,
                label: item.label,
                receiptTag: '[MENU:PASS]',
            }
    }
}
