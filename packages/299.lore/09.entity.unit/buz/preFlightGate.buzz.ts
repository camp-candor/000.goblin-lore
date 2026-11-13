import type {
    LimbStatusType,
    SomaticLimbProfile,
    SomaticSatVerificationReport,
    ForeignKeyResolutionReport,
    PreFlightEntityGateReport,
    default as EntityPreFlightGateBit,
} from '../fce/preFlightGate.bit.js'
import type { EntityModel } from '../entity.model.js'
import type State from '../../99.core/state.js'

const LIMB_CAPACITY_BPS: Record<LimbStatusType, number> = {
    INTACT: 10000,
    IMPAIRED: 5000,
    PARALYZED: 0,
    AMPUTATED: 0,
}

export function evaluateEntitySomaticSat(
    entityId: string,
    somatic: SomaticLimbProfile | undefined,
    requiredHandsBps: number = 0,
): SomaticSatVerificationReport {
    if (!Number.isInteger(requiredHandsBps)) {
        throw new Error(
            '[FLOAT_PROHIBITED] requiredHandsBps must be an integer',
        )
    }
    if (requiredHandsBps < 0 || requiredHandsBps > 20000) {
        throw new Error(
            '[OUT_OF_BOUNDS] requiredHandsBps must be between 0 and 20000',
        )
    }

    let availableHandsBps = 20000

    if (somatic) {
        if (somatic.available_arms_bps !== undefined) {
            if (!Number.isInteger(somatic.available_arms_bps)) {
                throw new Error(
                    '[FLOAT_PROHIBITED] available_arms_bps must be an integer',
                )
            }
            if (
                somatic.available_arms_bps < 0 ||
                somatic.available_arms_bps > 20000
            ) {
                throw new Error(
                    '[OUT_OF_BOUNDS] available_arms_bps must be between 0 and 20000',
                )
            }
            availableHandsBps = somatic.available_arms_bps
        } else if (
            somatic.left_arm !== undefined ||
            somatic.right_arm !== undefined
        ) {
            const leftBps = LIMB_CAPACITY_BPS[somatic.left_arm || 'INTACT']
            const rightBps = LIMB_CAPACITY_BPS[somatic.right_arm || 'INTACT']
            availableHandsBps = leftBps + rightBps
        }
    }

    const errors: string[] = []
    if (requiredHandsBps > availableHandsBps) {
        errors.push(
            `[SOMATIC_SAT_BREACH] Required ${requiredHandsBps} bps exceeds available ${availableHandsBps} bps on ${entityId}`,
        )
    }

    return {
        valid: errors.length === 0,
        entityId,
        availableHandsBps,
        requiredHandsBps,
        errors,
    }
}

export function verifyEntityForeignKeys(
    entityId: string,
    frontmatter: Record<string, unknown>,
    catalogIds: Set<string> | string[],
): ForeignKeyResolutionReport {
    const knownIds =
        catalogIds instanceof Set ? catalogIds : new Set(catalogIds)
    const errors: string[] = []
    const danglingKeys: string[] = []
    let checkedPointersCount = 0

    const checkPointer = (
        field: string,
        targetId: unknown,
        forbidReflexive: boolean = false,
    ) => {
        if (typeof targetId !== 'string' || targetId.trim().length === 0) return
        checkedPointersCount++

        if (forbidReflexive && targetId === entityId) {
            errors.push(
                `[REFLEXIVE_POINTER_PROHIBITED] Entity '${entityId}' cannot reference itself in '${field}'`,
            )
            return
        }

        if (!knownIds.has(targetId)) {
            danglingKeys.push(targetId)
            errors.push(
                `[DANGLING_FOREIGN_KEY] Field '${field}' on '${entityId}' references unauthored entity '${targetId}'`,
            )
        }
    }

    if (typeof frontmatter.location_id === 'string') {
        checkPointer('location_id', frontmatter.location_id, false)
    }

    if (Array.isArray(frontmatter.possessions)) {
        for (const itemId of frontmatter.possessions) {
            checkPointer('possessions', itemId, false)
        }
    }

    if (Array.isArray(frontmatter.grievance_targets)) {
        for (const targetId of frontmatter.grievance_targets) {
            checkPointer('grievance_targets', targetId, true)
        }
    }

    if (Array.isArray(frontmatter.clue_entities)) {
        for (const clueId of frontmatter.clue_entities) {
            checkPointer('clue_entities', clueId, false)
        }
    }

    return {
        valid: errors.length === 0,
        entityId,
        checkedPointersCount,
        danglingKeys,
        errors,
    }
}

export function runEntityPreFlightGate(
    entityId: string,
    frontmatter: Record<string, unknown>,
    catalogIds: Set<string> | string[],
    requiredHandsBps: number = 0,
): PreFlightEntityGateReport {
    const somaticProfile = frontmatter.somatic as SomaticLimbProfile | undefined
    const somatic = evaluateEntitySomaticSat(
        entityId,
        somaticProfile,
        requiredHandsBps,
    )
    const foreignKeys = verifyEntityForeignKeys(
        entityId,
        frontmatter,
        catalogIds,
    )
    const errors = [...somatic.errors, ...foreignKeys.errors]

    return {
        passed: somatic.valid && foreignKeys.valid,
        entityId,
        somatic,
        foreignKeys,
        errors,
    }
}

export const runEntityPreFlightGateAction = (
    cpy: EntityModel,
    bal: EntityPreFlightGateBit,
    ste?: State,
): EntityModel => {
    const dat = bal?.dat
    if (!dat) {
        if (bal?.slv) {
            bal.slv({
                entBit: {
                    idx: 'run-entity-preflight-gate-err',
                    val: -1,
                    dat: {
                        passed: false,
                        entityId: '',
                        somatic: {
                            valid: false,
                            entityId: '',
                            availableHandsBps: 0,
                            requiredHandsBps: 0,
                            errors: ['[MISSING_PAYLOAD] dat is required'],
                        },
                        foreignKeys: {
                            valid: false,
                            entityId: '',
                            checkedPointersCount: 0,
                            danglingKeys: [],
                            errors: [],
                        },
                        errors: ['[MISSING_PAYLOAD] dat is required'],
                    },
                },
            })
        }
        return cpy
    }

    const report = runEntityPreFlightGate(
        dat.entityId,
        dat.frontmatter,
        dat.catalogIds,
        dat.requiredHandsBps ?? 0,
    )

    if (bal?.slv) {
        bal.slv({
            entBit: {
                idx: 'run-entity-preflight-gate',
                val: report.passed ? 0 : -1,
                dat: report,
            },
        })
    }

    return cpy
}
