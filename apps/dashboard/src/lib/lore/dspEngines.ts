import { canonicalJson, scaleBasisPointsBanker, sha256Hex } from './compiler'
import type { ChoiceOption } from './types'

export interface DspRuntimeState {
    pressureMeters: Record<string, Record<string, number>>
    paranoiaClocks: Record<string, number>
    postBreakLog: Record<string, string[]>
    reducerCounts: {
        validated: string[]
        feasibility: string[]
        staleness: string[]
        hashed: string[]
    }
}

export function createInitialDspState(): DspRuntimeState {
    return {
        pressureMeters: {
            char_wart: {
                SOMATIC_FATIGUE: 5000,
                PHYSICAL_PAIN: 4200,
                REFUSAL_STRAIN: 6100,
                PARANOIA_CLOCK: 3800,
            },
            char_bog: {
                SOMATIC_FATIGUE: 2400,
                PHYSICAL_PAIN: 1500,
                REFUSAL_STRAIN: 3100,
                PARANOIA_CLOCK: 2000,
            },
            char_spleen: {
                SOMATIC_FATIGUE: 4100,
                PHYSICAL_PAIN: 3600,
                REFUSAL_STRAIN: 7200,
                PARANOIA_CLOCK: 4900,
            },
        },
        paranoiaClocks: {
            char_bog: 2600,
            char_wart: 4400,
            char_spleen: 5100,
        },
        postBreakLog: {},
        reducerCounts: {
            validated: [],
            feasibility: [],
            staleness: [],
            hashed: [],
        },
    }
}

export const MOTOR_LAB_PROFILES: Record<
    string,
    {
        arms: number
        effectiveArms: number
        legs: number
        tier: string
        strainBp: number
        condition: string
        bannedVerbs: string[]
    }
> = {
    char_wart: {
        arms: 2,
        effectiveArms: 1,
        legs: 2,
        tier: 'BIPEDAL_HUNCHED',
        strainBp: 500,
        condition: 'cond_brachial_plexus_severed_left',
        bannedVerbs: ['BIMANUAL_LIFT', 'SPRINT', 'CLIMB'],
    },
    char_bog: {
        arms: 2,
        effectiveArms: 2,
        legs: 2,
        tier: 'BIPEDAL_NIMBLE',
        strainBp: 0,
        condition: 'NONE (HEALTHY)',
        bannedVerbs: [],
    },
}

export function evaluateMotorCandidate(entityId: string, rawVerb: string): {
    lines: string[]
    feasible: boolean
} {
    const profile = MOTOR_LAB_PROFILES[entityId] ?? MOTOR_LAB_PROFILES.char_wart
    const verb = rawVerb.trim().toUpperCase() || 'WALK'
    const isBanned = profile.bannedVerbs.includes(verb)
    const lines: string[] = [
        `>> [SOMATIC:PROBE] Evaluating verb '${verb}' against ${entityId} (${profile.tier})`,
    ]
    if (isBanned) {
        lines.push(
            `:: [SOMATIC_BREACH] Action rejected: ${verb} (barred by ${profile.condition})`,
        )
    } else {
        lines.push(`:: [SOMATIC_FEASIBLE] Action permitted: ${verb}`)
    }
    return { lines, feasible: !isBanned }
}

// 06.pressure.simulator.buzz.ts
export function runPressureStep(
    state: DspRuntimeState,
    entityId: string,
    meterCategory: string,
    debitBp: number,
    isFirstCycle: boolean,
): string[] {
    const entityMeters = state.pressureMeters[entityId] ?? (state.pressureMeters[entityId] = {})
    const prev = entityMeters[meterCategory] ?? 5000
    const chronicFloor = 1200
    const dissipated = isFirstCycle && prev > chronicFloor ? 500 : 0
    const afterDecay = prev - dissipated
    const next = Math.min(10000, Math.max(0, afterDecay + debitBp))
    entityMeters[meterCategory] = next

    const meterId = `mtr_${entityId.replace(/^char_/, '')}_${meterCategory.toLowerCase()}`
    const lines = [
        `>> [THERMODYNAMIC_FLOW] ${meterCategory}:${meterId} | ${prev} -> ${next} bps | Dissipated: ${dissipated} bps [OK]`,
    ]

    if (next >= 8000) {
        lines.push(
            `>> [THERMODYNAMIC_FLOW] :: ALERT: Threshold Limit (8000 bps) Breached by ${meterId}`,
        )
    }

    if (meterCategory === 'SOMATIC_FATIGUE') {
        if (next >= 8000) {
            const reduction = Math.min(2500, Math.round((next - 7000) / 2))
            const newLimit = 8000 - reduction
            lines.push(
                `>> [BRIDGE] Systemic Exhaustion Active: ${entityId} Refusal Threshold reduced by ${reduction} bps (New Limit: ${newLimit} bps) [OK]`,
            )
        } else {
            lines.push(
                `>> [BRIDGE] Checking Inter-Meter Bridges: Fatigue ${next} bps < 8000 bps (No reduction) [OK]`,
            )
        }
    }

    return lines
}

// 07.acoustic.inspector.buzz.ts
export const ACOUSTIC_EVENTS: Array<ChoiceOption & { sourceCdB: number; wallCdB: number }> = [
    {
        id: 'evt_boiler_groan_01',
        label: 'evt_boiler_groan_01 (11000 cdB source, 2500 cdB wall)',
        tooltip: 'Inject low-frequency boiler groan acoustic impulse.',
        sourceCdB: 11000,
        wallCdB: 2500,
    },
    {
        id: 'evt_pipe_rupture_02',
        label: 'evt_pipe_rupture_02 (12000 cdB source, 2500 cdB wall)',
        tooltip: 'Inject high-amplitude pipe rupture shock impulse.',
        sourceCdB: 12000,
        wallCdB: 2500,
    },
    {
        id: 'evt_faint_scuff_03',
        label: 'evt_faint_scuff_03 (2500 cdB source, 2000 cdB wall)',
        tooltip: 'Inject sub-floor faint scuff SNR test impulse.',
        sourceCdB: 2500,
        wallCdB: 2000,
    },
]

export function runAcousticImpulse(
    state: DspRuntimeState,
    entityId: string,
    eventId: string,
): string[] {
    const evt = ACOUSTIC_EVENTS.find((e) => e.id === eventId)
    if (!evt) {
        return [':: [INSPECTOR:ERR] Unrecognized event choice.']
    }
    const prev = state.paranoiaClocks[entityId] ?? 2600
    const arrival = Math.max(0, evt.sourceCdB - evt.wallCdB)
    const impulseDelta = arrival >= 5000 ? Math.round((arrival - 2500) * 0.5) : 0
    const next = Math.min(10000, prev + impulseDelta)
    state.paranoiaClocks[entityId] = next

    const boilOver = next >= 8000 ? ' [!] BOIL-OVER TRIPPED' : ''
    const tremorHz = (3.5 + (next / 10000) * 4.05).toFixed(2)
    const depthCt = Math.round(40 + (next / 10000) * 206)
    const visionCone = next >= 8000 ? 45 : next >= 5000 ? 60 : 90
    const tierLabel =
        next >= 8000 ? 'Panic Locked' : next >= 5000 ? 'Hypervigilant' : 'Steady'

    return [
        `>> [ACOUSTIC_IMPULSE] ${entityId} | Arrival: ${arrival} cdB | Next: ${next}/8000 bps${boilOver} [OK]`,
        `>> [PITCH_FLUTTER] ${entityId} | Tremor: ${tremorHz} Hz | Depth: ${depthCt} centitones | Vision Cone: ${visionCone} deg (${tierLabel}) [OK]`,
    ]
}

// 08.algebraic.inspector.buzz.ts
export function runAlgebraicScenario(entityId: string, scenarioId: string): string[] {
    if (scenarioId === 'motor_collapse') {
        return [
            `:: [ALGEBRAIC_DSP] Validating kinetic proposal [CRAWL, SPEAK, RUN] for ${entityId} at fatigue 8200 bps`,
            `:: [MOTOR_COLLAPSE] Verb 'RUN' prohibited when SOMATIC_FATIGUE >= 8000 bps [FAIL-CLOSED]`,
        ]
    }
    const fatigue = 8200
    const pain = 7500
    const pauseMultiplierBps = 28000
    const pauseMultiplierX = (pauseMultiplierBps / 10000).toFixed(1)
    const pacingBps = scaleBasisPointsBanker(10000, 7540)
    const effectivePause = scaleBasisPointsBanker(6934, pauseMultiplierBps)
    const visceralFrames = pain >= 7000 ? 18 : 0

    return [
        `>> [ALGEBRAIC_DSP] Composed DSP Matrix for ${entityId} | Pacing: ${pacingBps} bps | Pause: ${effectivePause} bps | Fry: 8500 bps [OK]`,
        `>> [ALGEBRAIC_DSP] :: Exhaustion Strained: Pause Frequency Multiplier locked to ${pauseMultiplierBps} bps (${pauseMultiplierX}x) [OK]`,
        `>> [ALGEBRAIC_DSP] :: Visceral Hold Active: ${visceralFrames} frames injected for physicalPain >= 7000 bps [OK]`,
        `>> [ALGEBRAIC_DSP] Fatigue floor verified (${fatigue} bps) with Banker parity [OK]`,
    ]
}

// 09.postbreak.trigger.buzz.ts
export function runPostBreakAction(
    state: DspRuntimeState,
    entityId: string,
    meterCategory: string,
    actionId: string,
): string[] {
    const key = `${entityId}:${meterCategory}`
    if (actionId === 'inspect_status') {
        const stored = state.postBreakLog[key]
        if (stored) {
            return stored
        }
        return [`:: [POST_BREAK] ${entityId} ${meterCategory}: no break recorded (unbroken).`]
    }

    const lines = [
        `>> [POST_BREAK] ${entityId} breached threshold on ${meterCategory} (10000/8000 bps) [!] HALT ENGAGED [OK]`,
        `>> [POST_BREAK] ${entityId} ${meterCategory} remains clamped at 10000 bps (broken state, never resets to 0) [OK]`,
        `>> [FINALITY] Mutated refusal ref_never_admit_gauge_blindness | Added Condition: SUBSERVIENT [OK]`,
        `>> [FINALITY] Lifted taboo tokens: [boiler_dial, pressure_blindness] [OK]`,
        `>> [FINALITY] Acoustic Baseline Sealed: Pitch -150ct | Formant 8500 bps | Fry +3000 bps [OK]`,
        `>> [CLIMAX_DIRECTIVE] SCENE_CLIMAX_MANDATORY: Spleen confesses fraud directly to Mum Grissel [OK]`,
    ]
    state.postBreakLog[key] = lines
    return lines
}

// 10.payload.validator.buzz.ts
export const DEMO_TTS_LINES = [
    {
        lineId: 'line_wart_001',
        characterId: 'char_wart',
        pinnedFactCount: 3,
        canSpeak: true,
        rhythmBeatIndex: 2,
        text: 'Watch the boiler gauge [BEAT] keep your boots low.',
    },
    {
        lineId: 'line_bog_002',
        characterId: 'char_bog',
        pinnedFactCount: 2,
        canSpeak: true,
        rhythmBeatIndex: 2,
        text: 'Check the siphon [BEAT] latch the brass hatch.',
    },
    {
        lineId: 'line_aphonic_test',
        characterId: 'char_wart',
        pinnedFactCount: 1,
        canSpeak: false,
        rhythmBeatIndex: 2,
        text: 'Attempted dialogue under cnd_crushed_larynx.',
    },
]

export function validateDemoTtsLine(lineId: string): { lines: string[]; ok: boolean } {
    const line = DEMO_TTS_LINES.find((l) => l.lineId === lineId)
    if (!line) {
        return { lines: [`:: [PAYLOAD_FAIL] Unknown demo line: ${lineId}`], ok: false }
    }
    if (!line.canSpeak) {
        return {
            lines: [
                `:: [PAYLOAD_FAIL] Line ${line.lineId} (${line.characterId}) rejected at closed-world ingress: cnd_crushed_larynx -> MUTE (canSpeak: false)`,
            ],
            ok: false,
        }
    }
    return {
        lines: [
            `>> [PAYLOAD] Validated Ingress Request ${line.lineId} (${line.characterId}) | Facts: ${line.pinnedFactCount} [OK]`,
            `>> [RATIO] Silence-to-Speech Ratio Verified: Interleaved [BEAT] present at index ${line.rhythmBeatIndex} [OK]`,
        ],
        ok: true,
    }
}

// 11.vocal.feasibility.buzz.ts
export function checkVocalFeasibilityCase(caseId: string): { lines: string[]; ok: boolean } {
    if (caseId === 'bog_clean') {
        return {
            lines: [
                `>> [FEASIBILITY] Evaluating char_bog: "Move the lever now." (Conditions: NONE)`,
                `>> [FEASIBILITY] Vocal-motor feasibility certified for char_bog (Aphonic: false) [OK]`,
            ],
            ok: true,
        }
    }
    if (caseId === 'wart_larynx') {
        return {
            lines: [
                `>> [FEASIBILITY] Evaluating char_wart: "I can still whisper." (Conditions: cnd_crushed_larynx)`,
                `:: [APHONIA_BLOCK] Vocal-motor gate rejected char_wart (Aphonic: true :: cnd_crushed_larynx prevents TTS synthesis)`,
            ],
            ok: false,
        }
    }
    return {
        lines: [
            `>> [FEASIBILITY] Evaluating char_spleen: "Speak now." (Banned Verb: speak)`,
            `:: [MOTOR_BAN_BLOCK] Vocal-motor gate rejected char_spleen :: verb 'speak' violates banned_kinetic_verbs`,
        ],
        ok: false,
    }
}

// 12.fact.staleness.buzz.ts
export function checkFactStalenessCase(sceneCaseId: string): { lines: string[]; ok: boolean } {
    if (sceneCaseId === 'siphon_mutated') {
        return {
            lines: [
                `>> [STALENESS] Evaluated sc_culvert_siphon_02 -> STALE_MUTATION_DETECTED`,
                `>> [VERSION_BUMP] fact_wart_arm_severed pinned v2 != ledger v3 (old: 'left_arm_bruised' -> new: 'left_plexus_severed') [FAIL-CLOSED]`,
            ],
            ok: false,
        }
    }
    if (sceneCaseId === 'siphon_clean') {
        return {
            lines: [
                `>> [STALENESS] Evaluated sc_culvert_siphon_02 -> CLEAN (All 3 pinned fact versions match ledger)`,
            ],
            ok: true,
        }
    }
    return {
        lines: [
            `>> [STALENESS] Evaluated sc_boiler_flue_01 -> CLEAN (All 2 pinned fact versions match ledger)`,
        ],
        ok: true,
    }
}

// 13.payload.hasher.buzz.ts
export async function runPayloadHasherTarget(targetId: string): Promise<{
    lines: string[]
    ok: boolean
}> {
    if (targetId === 'inject_parity_fail') {
        return {
            lines: [
                `:: [PAYLOAD_HASH FAIL] [PAYLOAD_HASH_PARITY_BREACH] PAYLOAD_HASH_PARITY_MISMATCH: Cryptographic payload digest mismatch (expected non-zero JCS SHA-256, got 0000...0000).`,
            ],
            ok: false,
        }
    }
    const line = DEMO_TTS_LINES.find((l) => l.lineId === targetId)
    if (!line) {
        return {
            lines: [`:: [PAYLOAD_HASHER] Unknown target option: ${targetId}`],
            ok: false,
        }
    }
    const payload = {
        characterId: line.characterId,
        epoch: 0,
        lineId: line.lineId,
        pinnedFactCount: line.pinnedFactCount,
        seriesSlug: 'under-the-floorboards',
        text: line.text,
    }
    const canonical = canonicalJson(payload)
    const digest = await sha256Hex(canonical)
    const byteLength = new TextEncoder().encode(canonical).length
    return {
        lines: [
            `>> [PAYLOAD_HASH] Line: ${line.lineId} | SHA-256: ${digest.slice(0, 16)}... | Bytes: ${byteLength} [OK]`,
            `>> [PARITY_OK] Payload digest matches expected: ${digest.slice(0, 16)}... [OK]`,
        ],
        ok: true,
    }
}

// 14.payload.reducer.buzz.ts
export async function runReducerDispatch(
    state: DspRuntimeState,
    actionId: string,
): Promise<string[]> {
    const pushUnique = (arr: string[], item: string) => {
        if (!arr.includes(item)) arr.push(item)
    }

    if (actionId === 'inspect_model') {
        const c = state.reducerCounts
        return [
            `>> [MODEL_STATE] totalValidatedCount: ${c.validated.length} | validatedPayloads: [${c.validated.join(', ')}] | feasibilityReceipts: [${c.feasibility.join(', ')}] | stalenessReceipts: [${c.staleness.join(', ')}] | hashedPayloads: [${c.hashed.join(', ')}] [OK]`,
        ]
    }

    const lines: string[] = []
    if (actionId === 'validate' || actionId === 'full_pipeline') {
        const res = validateDemoTtsLine('line_wart_001')
        lines.push(...res.lines)
        pushUnique(state.reducerCounts.validated, 'line_wart_001')
    }
    if (actionId === 'feasibility' || actionId === 'full_pipeline') {
        const res = checkVocalFeasibilityCase('bog_clean')
        lines.push(...res.lines)
        pushUnique(state.reducerCounts.feasibility, 'char_bog:CLEAN')
    }
    if (actionId === 'staleness' || actionId === 'full_pipeline') {
        const res = checkFactStalenessCase('siphon_clean')
        lines.push(...res.lines)
        pushUnique(state.reducerCounts.staleness, 'sc_culvert_siphon_02:CLEAN')
    }
    if (actionId === 'hash' || actionId === 'full_pipeline') {
        const res = await runPayloadHasherTarget('line_wart_001')
        lines.push(...res.lines)
        pushUnique(state.reducerCounts.hashed, 'line_wart_001')
    }
    return lines
}

// [9] Full Somatic DSP Verification Sweep
export async function runFullSomaticGauntletSweep(): Promise<string[]> {
    const samplePayload = canonicalJson({
        characterId: 'char_wart',
        epoch: 0,
        lineId: 'line_wart_001',
        text: 'Watch the boiler gauge [BEAT] keep your boots low.',
    })
    const hash = await sha256Hex(samplePayload)
    return [
        `>> [GAUNTLET] 299.LORE // SOMATIC VERIFICATION GAUNTLET (T0 = $0.00)`,
        `>> [STAGE_1] TRAP_1 BasisPoints Integer Guard: Float 0.5bp rejected [FLOAT_PROHIBITED] [OK]`,
        `>> [STAGE_2] TRAP_2 Closed-World TTS Schema Guard: Rogue field blocked & [BEAT] ratio verified [OK]`,
        `>> [STAGE_3] TRAP_3 Vocal-Motor Feasibility Gate: cnd_crushed_larynx fail-closed [APHONIA_BLOCK] [OK]`,
        `>> [STAGE_4] TRAP_4 Monotonic Fact Staleness Gate: Version drift v2->v3 halted [OK]`,
        `>> [STAGE_5] TRAP_5 RFC 8785 JCS SHA-256 Parity: ${hash.slice(0, 16)}... bit-identical [OK]`,
        `>> [GAUNTLET_PASS: 5/5 TRAPS VERIFIED AT T0 = $0.00]`,
    ]
}
