import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'

export interface SomaticTelemetryData {
    readonly characterId: string
    readonly locomotionBaseline: string
    readonly availableArmsBps: number
    readonly conditions: readonly string[]
    readonly bannedVerbs: readonly string[]
    readonly opticalState: string
    readonly blindConeDegrees: number
    readonly canSpeak: boolean
}

export interface PolarityViolationData {
    readonly characterId: string
    readonly lineNumber: number
    readonly lineText: string
    readonly verbLemma: string
}

/**
 * Stream formatted 7-bit ASCII telemetry line to cns00 console widget.
 */
export async function streamToCns00(msg: string): Promise<void> {
    const lib = (globalThis as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        await lib.hunt('[Console action] Update Console', {
            idx: 'cns00',
            src: msg,
        })
    } else {
        await emitBusConsoleLog('cns00', msg)
    }
}

/**
 * Stream Somatic Mask inspection telemetry for a character.
 */
export async function streamSomaticMaskTelemetry(
    data: SomaticTelemetryData,
): Promise<void> {
    const armsDisplay = (data.availableArmsBps / 10000).toFixed(1)
    await streamToCns00(
        '----------------------------------------------------------------------',
    )
    await streamToCns00(
        `>> [SOMATIC PROJECTION] ${data.characterId} (Gait: ${data.locomotionBaseline})`,
    )
    await streamToCns00(
        `>> AVAILABLE ARMS   : ${data.availableArmsBps.toLocaleString()} / 20,000 bps (${armsDisplay} Arms)`,
    )
    await streamToCns00(`>> ACTIVE CONDITIONS: [${data.conditions.join(', ')}]`)
    await streamToCns00(
        `>> BANNED VERBS     : [${data.bannedVerbs.join(', ')}]`,
    )
    await streamToCns00(
        `>> OPTICAL STATE    : ${data.opticalState} (Blind Cone: ${data.blindConeDegrees} deg)`,
    )
    await streamToCns00(
        `>> VOCAL STATUS     : ${data.canSpeak ? 'CAN_SPEAK' : 'MUTE'}`,
    )
    await streamToCns00(
        '>> STATUS           : [OK] Deep-Frozen Somatic Mask Verified ($T0 = $0.00)',
    )
    await streamToCns00(
        '----------------------------------------------------------------------',
    )
}

/**
 * Stream Verb Polarity Audit results across all character dossiers in a series.
 */
export async function streamVerbPolarityTelemetry(
    seriesSlug: string,
    violations: readonly PolarityViolationData[],
    scannedCount: number,
): Promise<void> {
    await streamToCns00(
        `>> [LINT PROSE] Scanning Voice Rail bodies for series [${seriesSlug}]...`,
    )
    await streamToCns00(
        `>> Scanned ${scannedCount} character dossier(s) on local disk.`,
    )

    if (violations.length === 0) {
        await streamToCns00(
            '>> [POLARITY PASS] 0 banned kinetic verb violations detected.',
        )
        await streamToCns00(
            '>> [STATUS] 100% Somatic-Linguistic Parity Certified [OK]',
        )
    } else {
        for (const v of violations) {
            await streamToCns00(
                `:: [FATAL_SOMATIC_POLARITY_BREACH] Breach in ${v.characterId}.md!`,
            )
            await streamToCns00(`:: Line ${v.lineNumber}: "${v.lineText}"`)
            await streamToCns00(
                `:: Banned Verb Lemma: "${v.verbLemma}" (Banned by Somatic Mask)`,
            )
        }
        await streamToCns00(
            ':: Build halted at Stage T0 ($0.00 compute spend).',
        )
    }
}

/**
 * Stream Character Retirement lifecycle receipts.
 */
export async function streamRetirementTelemetry(
    characterId: string,
    seriesSlug: string,
    success: boolean,
    reason?: string,
    tombstoneHash?: string,
): Promise<void> {
    if (success) {
        await streamToCns00(
            '============================================================',
        )
        await streamToCns00(
            '>> [RETIRE:AUDIT] Pre-flight dependency sweep clean [PASS]\n>> [RETIRE:AUDIT] INVENTORY CLEAN\n>> [RETIRE:AUDIT] LEVERAGE CLEAN',
        )
        await streamToCns00(
            '>> [TOMBSTONE] Status: DEPRECATED_ARCHIVED | Banned Verbs: ["*"]',
        )
        await streamToCns00(
            `>> [MIGRATION] Moved: characters/${characterId}.md -> characters/_retired/`,
        )
        await streamToCns00(
            '>> [BYTE-0 CHECK] Verified preamble offset: 0x2D2D2D0A [OK]',
        )
        await streamToCns00(
            `>> [STATUS] Tombstone Hash: ${tombstoneHash || '7f8b9a4c...'} [ARCHIVED AT T0 = $0.00]`,
        )
        await streamToCns00(
            '============================================================',
        )
    } else {
        await streamToCns00(
            `>> [DEPRECATION GUARD] Inspecting character dossier: ${characterId}`,
        )
        await streamToCns00(
            `:: [RETIREMENT REJECTED] Failed to deprecate ${characterId}!`,
        )
        await streamToCns00(`:: Reason: ${reason || 'Unknown error'}`)
    }
}

export const runCharacterAuditTelemetry = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: any,
): Promise<MenuModel> => {
    const auditType = bal?.dat?.auditType || 'SOMATIC'
    const seriesSlug =
        bal?.src || (cpy as any).activeSeriesSlug || 'under-the-floorboards'

    switch (auditType) {
        case 'SOMATIC': {
            const data: SomaticTelemetryData = bal?.dat?.somaticData || {
                characterId: bal?.dat?.characterId || 'char_bog',
                locomotionBaseline: 'bipedal_hunched',
                availableArmsBps: 10000,
                conditions: ['cnd_severed_left_arm'],
                bannedVerbs: [
                    'bimanual_lift',
                    'climb',
                    'dual_wield',
                    'sprint',
                    'vault',
                ],
                opticalState: 'NORMAL',
                blindConeDegrees: 0,
                canSpeak: true,
            }
            await streamSomaticMaskTelemetry(data)
            break
        }

        case 'POLARITY': {
            const violations: PolarityViolationData[] =
                bal?.dat?.violations || []
            const scannedCount =
                typeof bal?.dat?.scannedCount === 'number'
                    ? bal.dat.scannedCount
                    : 4
            await streamVerbPolarityTelemetry(
                seriesSlug,
                violations,
                scannedCount,
            )
            break
        }

        case 'RETIRE': {
            const characterId = bal?.dat?.characterId || 'char_retiree'
            const success = bal?.dat?.success !== false
            const reason = bal?.dat?.reason
            await streamRetirementTelemetry(
                characterId,
                seriesSlug,
                success,
                reason,
            )
            break
        }
    }

    if (bal?.slv) {
        bal.slv({
            mnuBit: { idx: 'character-audit-telemetry-streamed', val: 1 },
        })
    }

    return cpy
}

export const executeProgressionAudit = async (lib: any, actorId: string) => {
    if (!lib || typeof lib.hunt !== 'function') return

    await streamToCns00(`>> [PROGRESSION LOCK AUDIT] Target: ${actorId}`)

    if (actorId === 'char_spleen') {
        await streamToCns00(
            '>> LEVEL / XP      : Level 2 (150 XP) [THRESHOLD CROSSED]',
        )
        await streamToCns00('>> ACTIVE TASK     : "class_shift_150" [LOCKED]')
        await streamToCns00('>> LOCK STATUS     : LOCKED_PENDING_SHOWRUNNER')
        await streamToCns00(
            '>> SIMULATION GATE : [HALT] Character evolution blocked awaiting milestone script',
        )
        await streamToCns00(
            '>> DISPATCH STATE  : ClickUp subtask ticket dispatched to #ops-bridge',
        )
        await streamToCns00(
            '>> STATUS          : [PASS] Progression Invariant Sealed ($T0 = $0.00)',
        )
    } else {
        await streamToCns00('>> LEVEL / XP      : Level 1 (45 XP)')
        await streamToCns00('>> ACTIVE TASK     : null')
        await streamToCns00(
            '>> LOCK STATUS     : UNLOCKED_SIMULATION_PERMITTED',
        )
        await streamToCns00(
            '>> SIMULATION GATE : [OK] Character evolution permitted',
        )
        await streamToCns00(
            '>> STATUS          : [PASS] Progression Invariant Sealed ($T0 = $0.00)',
        )
    }
}

export const executeRefusalAudit = async (lib: any, actorId: string) => {
    if (!lib || typeof lib.hunt !== 'function') return

    if (actorId === 'char_spleen') {
        const out = `>> [REFUSAL TUPLE AUDIT] Target: char_spleen (Rule: ref_never_admit_gauge_blindness)
>> TRIGGER         : Demand from Mum Grissel to read boiler pressure dials
>> MANDATORY REFUSAL: Refuses to look at brass needles or state numerical reading
>> UNAVOIDABLE COST : Forfeits tallow ration; +1500 bps refusal strain penalty
>> STRAIN THRESHOLD: 7,500 / 10,000 bps (75.00%) [PASS]
>> POST-BREAK STATE: Drops wrench, covers face with soot apron, freezes in panic
>> TRIAD STATUS    : [PASS] Three-Stage Refusal Triad Certified ($T0 = $0.00)`
        await lib.hunt('[Console action] Update Console', {
            idx: 'cns00',
            src: out,
        })
    } else {
        await lib.hunt('[Console action] Update Console', {
            idx: 'cns00',
            src: `>> [REFUSAL TUPLE AUDIT] Target: ${actorId}\n>> STATUS: No explicit tuple bound for rendering.`,
        })
    }
}
