/* eslint-disable */
/**
 * packages/299.lore/98.menu.unit/buz/09.postbreak.trigger.buzz.ts
 *
 * Interactive Post-Break Finality Trigger for the Somatic DSP
 * Modulation Hub. Drives the 35.threshold.unit irreversible finality
 * engine (breach interception, taboo fence lifting, permanent acoustic
 * sealing) and streams 7-bit ASCII receipts into the cns00 console
 * pane. Broken-state receipts persist in a module registry so the
 * somatic status view can prove meters never reset to zero.
 */

import { ThresholdModel } from '../../35.threshold.unit/threshold.model.js'
import { evaluatePostBreakThreshold } from '../../35.threshold.unit/threshold.buzzer.js'
import type {
    PostBreakReceipt,
    PostBreakMutationDirective,
} from '../../35.threshold.unit/val/postBreak.val.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export const TRIGGER_BACK_LABEL = '[<] BACK'
export const TRIGGER_ENTITY_IDS = ['char_spleen', 'char_wart', 'char_bog']
export const TRIGGER_METER_CATEGORIES = [
    'SOMATIC_FATIGUE',
    'PHYSICAL_PAIN',
    'REFUSAL_STRAIN',
    'PARANOIA_CLOCK',
]
export const TRIGGER_FORCE_BREACH_LABEL = 'Force Breach: 10000/8000 bps'
export const TRIGGER_INSPECT_STATUS_LABEL = '[Inspect Somatic Status]'
export const TRIGGER_ACTION_LABELS = [
    TRIGGER_FORCE_BREACH_LABEL,
    TRIGGER_INSPECT_STATUS_LABEL,
]

const FORCE_BREACH_VALUE_BP = 10000
const FORCE_BREACH_LIMIT_BP = 8000

const CATEGORY_METER_SUFFIX: Record<string, string> = {
    SOMATIC_FATIGUE: 'fatigue',
    PHYSICAL_PAIN: 'pain',
    REFUSAL_STRAIN: 'strain',
    PARANOIA_CLOCK: 'clock',
}

interface TriggerPreset {
    directive: PostBreakMutationDirective
    attenuationTokens: string[]
}

function presetFor(entityId: string): TriggerPreset {
    if (entityId === 'char_spleen') {
        return {
            directive: {
                entityId,
                targetRefusalVectorId: 'ref_never_admit_gauge_blindness',
                newBehaviorDirective:
                    'Admits total inability to read boiler dials; begs for assistance.',
                bannedTokensRemoved: ['boiler_dial', 'pressure_blindness'],
                terminalConditionAdded: 'SUBSERVIENT',
                permanentAcousticDeltas: {
                    basePitchShiftCentitones: -150,
                    formantWarpingBps: 8500,
                    vocalFryDensityBps: 3000,
                    breathinessPauseMultiplierBps: 12000,
                    bannedCadencesRemoved: [],
                },
                climaxSceneDirective:
                    'SCENE_CLIMAX_MANDATORY: Spleen confesses fraud directly to Mum Grissel.',
            },
            attenuationTokens: [
                'boiler_dial',
                'pressure_blindness',
                'grease',
                'culvert',
            ],
        }
    }
    const short = entityId.replace(/^char_/, '')
    return {
        directive: {
            entityId,
            targetRefusalVectorId: `ref_${short}_withholds_labor_ledger`,
            newBehaviorDirective: `Admits fault and submits to work detail review.`,
            bannedTokensRemoved: [`${short}_tally`, 'ledger_blindness'],
            terminalConditionAdded: 'SUBSERVIENT',
            permanentAcousticDeltas: {
                basePitchShiftCentitones: -150,
                formantWarpingBps: 8500,
                vocalFryDensityBps: 3000,
                breathinessPauseMultiplierBps: 12000,
                bannedCadencesRemoved: [],
            },
            climaxSceneDirective: `SCENE_CLIMAX_MANDATORY: ${short} confesses fault before the muster line.`,
        },
        attenuationTokens: [
            `${short}_tally`,
            'ledger_blindness',
            'grease',
            'culvert',
        ],
    }
}

function neutralAcousticProfile() {
    return {
        pitchShiftCentitones: 0,
        formantWarpingBps: 10000,
        vocalFryDensityBps: 0,
        breathinessPauseMultiplierBps: 10000,
        bannedCadences: [] as string[],
    }
}

const breakRegistry: Record<string, PostBreakReceipt> = {}
let breakTick = 0

function registryKey(entityId: string, category: string): string {
    return `${entityId}:${category}`
}

export function resetPostBreakTriggerRegistry(): void {
    for (const key of Object.keys(breakRegistry)) {
        delete breakRegistry[key]
    }
    breakTick = 0
}

async function openChoice(
    lib: any,
    lst: string[],
    hint: string,
): Promise<string | undefined> {
    const gridBit = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })
    const choiceBit = await lib.hunt(OPEN_CHOICE, {
        dat: {
            clr0: 0,
            clr1: 3,
            cb: (choice: string) => {
                lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `:: ${hint}: ${choice}`,
                })
            },
        },
        src: 'VERTICAL',
        lst,
        net: gridBit?.grdBit?.dat,
    })
    return choiceBit?.chcBit?.src
}

async function emitLine(lib: any, src: string): Promise<void> {
    await lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src })
}

export const runPostBreakFinalityTriggerMenu = async (
    _ste: any,
): Promise<void> => {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        return
    }

    const selectedEntity = await openChoice(
        lib,
        [...TRIGGER_ENTITY_IDS, TRIGGER_BACK_LABEL],
        '[TRIGGER:ENTITY]',
    )
    if (!selectedEntity || selectedEntity === TRIGGER_BACK_LABEL) {
        return
    }

    const selectedMeter = await openChoice(
        lib,
        [...TRIGGER_METER_CATEGORIES, TRIGGER_BACK_LABEL],
        '[TRIGGER:METER]',
    )
    if (!selectedMeter || selectedMeter === TRIGGER_BACK_LABEL) {
        return
    }

    const model = new ThresholdModel()
    const captureShim = {
        hunt: async (_action: string, _payload: any) => {},
    }
    const short = selectedEntity.replace(/^char_/, '')
    const suffix = CATEGORY_METER_SUFFIX[selectedMeter] || 'meter'
    const key = registryKey(selectedEntity, selectedMeter)

    for (;;) {
        const actionChoice = await openChoice(
            lib,
            [...TRIGGER_ACTION_LABELS, TRIGGER_BACK_LABEL],
            '[TRIGGER:ACTION]',
        )
        if (!actionChoice || actionChoice === TRIGGER_BACK_LABEL) {
            return
        }

        if (actionChoice === TRIGGER_INSPECT_STATUS_LABEL) {
            const recorded = breakRegistry[key]
            if (recorded) {
                await emitLine(
                    lib,
                    `>> [POST_BREAK] ${recorded.entityId} ${recorded.category} remains clamped at ${recorded.breachedValueBp} bps (broken state, never resets to 0) [OK]`,
                )
            } else {
                await emitLine(
                    lib,
                    `:: [POST_BREAK] ${selectedEntity} ${selectedMeter}: no break recorded (unbroken).`,
                )
            }
            continue
        }

        if (actionChoice !== TRIGGER_FORCE_BREACH_LABEL) {
            await emitLine(lib, ':: [TRIGGER:ERR] Unrecognized action choice.')
            continue
        }

        const preset = presetFor(selectedEntity)
        breakTick += 1
        let emitted: any
        evaluatePostBreakThreshold(
            model,
            {
                idx: 'postbreak-trigger-force-breach',
                dat: {
                    input: {
                        meterId: `mtr_${short}_${suffix}`,
                        entityId: selectedEntity,
                        category: selectedMeter,
                        currentValueBp: FORCE_BREACH_VALUE_BP,
                        thresholdLimitBp: FORCE_BREACH_LIMIT_BP,
                        mutationDirective: preset.directive,
                        tick: breakTick,
                    },
                    activeAcousticProfile: neutralAcousticProfile(),
                    currentAttenuationTokens: preset.attenuationTokens,
                },
                slv: (res: any) => {
                    emitted = res.trhBit
                },
            },
            captureShim as any,
        )

        if (!emitted || emitted.idx !== 'evaluate-post-break-breached') {
            await emitLine(
                lib,
                ':: [POST_BREAK] No breach: meter value below threshold.',
            )
            continue
        }

        const receipt = emitted.dat as PostBreakReceipt
        breakRegistry[key] = receipt

        await emitLine(
            lib,
            `>> [POST_BREAK] ${receipt.entityId} breached threshold on ${receipt.category} (${receipt.breachedValueBp}/${receipt.thresholdLimitBp} bps) [!] HALT ENGAGED [OK]`,
        )
        await emitLine(
            lib,
            `>> [FINALITY] Mutated refusal ${receipt.targetRefusalVectorId} | Added Condition: ${receipt.terminalConditionAdded} [OK]`,
        )
        await emitLine(
            lib,
            `>> [FINALITY] Lifted taboo tokens: [${receipt.bannedTokensRemoved.join(', ')}] [OK]`,
        )
        await emitLine(
            lib,
            `>> [FINALITY] Acoustic Baseline Sealed: Pitch ${receipt.updatedAcousticProfile.pitchShiftCentitones}ct | Formant ${receipt.updatedAcousticProfile.formantWarpingBps} bps | Fry +${preset.directive.permanentAcousticDeltas.vocalFryDensityBps} bps [OK]`,
        )
        await emitLine(
            lib,
            `>> [CLIMAX_DIRECTIVE] ${receipt.climaxSceneDirective} [OK]`,
        )
    }
}
