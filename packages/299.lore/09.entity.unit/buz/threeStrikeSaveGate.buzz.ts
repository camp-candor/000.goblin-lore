import * as fs from 'node:fs'
import { stageEntityScratchpad } from './stageEntityScratchpad.buzz.js'
import { suspendCursesAndSpawnEditor } from '../../98.menu.unit/buz/suspendCursesEditor.buzz.js'
import { verifyScratchpadSave } from '../../41.canon.unit/buz/verifyScratchpadSave.buzz.js'
import { executePassThreeGenesisSeal } from '../../41.canon.unit/buz/passThreeGenesisSeal.buzz.js'
import { executePassOneGenesisShape } from '../../41.canon.unit/buz/passOneGenesisShape.buzz.js'
import { executePassTwoGenesisGraph } from '../../41.canon.unit/buz/passTwoGenesisGraph.buzz.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import type { EntityModel } from '../entity.model.js'
import type HumanGateBit from '../fce/humanGate.bit.js'
import type { HumanGateResultPayload } from '../fce/humanGate.bit.js'
import type State from '../../99.core/state.js'

export const threeStrikeSaveGate = async (
    cpy: EntityModel,
    bal: HumanGateBit,
    _ste?: State,
): Promise<EntityModel> => {
    const entityId = bal.dat?.entityId
    const domain = bal.dat?.domain
    const seriesSlug = bal.src || bal.dat?.seriesSlug || 'wiregrass-basin'

    if (!entityId || !domain) {
        await emitBusConsoleLog(
            'cns00',
            '>> [FAIL] [HUMAN_GATE] Missing required entityId or domain.',
        )
        if (bal.slv)
            bal.slv({
                entityBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: 'INVALID_PARAMETERS' },
                },
            })
        return cpy
    }

    await emitBusConsoleLog(
        'cns00',
        `>> [HUMAN_GATE] Initializing scratchpad for ${domain}/${entityId} in '${seriesSlug}'...`,
    )

    // Stage isolated scratchpad (.tmp)
    const scratchpad = stageEntityScratchpad({
        seriesSlug,
        domain,
        entityId,
        initialFrontmatter: bal.dat?.initialFrontmatter,
    })

    const maxStrikes = 3
    let currentStrike = 1
    let saveSuccess = false
    let lastError = ''

    while (currentStrike <= maxStrikes && !saveSuccess) {
        await emitBusConsoleLog(
            'cns00',
            `>> [HUMAN_GATE] Strike ${currentStrike}/${maxStrikes}: Spawning editor on scratchpad...`,
        )

        // Hand off to editor
        const suspensionResult = await suspendCursesAndSpawnEditor(
            scratchpad.tmpFilePath,
        )
        if (!suspensionResult.success) {
            lastError = suspensionResult.error || 'EDITOR_SPAWN_FAILED'
            currentStrike++
            continue
        }

        // Verify scratchpad
        const verification = verifyScratchpadSave(
            scratchpad.tmpFilePath,
            domain,
        )
        if (verification.passed) {
            saveSuccess = true
            break
        }

        lastError = verification.error || 'VERIFICATION_FAILED'
        await emitBusConsoleLog(
            'cns00',
            `>> [WARN] [HUMAN_GATE] Strike ${currentStrike} Verification Failed: ${lastError}`,
        )

        if (currentStrike < maxStrikes) {
            // Prepend commented diagnostic block inside scratchpad for the author to review
            const existingContent = fs.readFileSync(
                scratchpad.tmpFilePath,
                'utf-8',
            )
            const diagnosticComment = [
                '---',
                `# [DIAGNOSTIC FAILURE - STRIKE ${currentStrike}/${maxStrikes}]`,
                `# ERROR: ${lastError}`,
                `# PLEASE RESOLVE THE ABOVE DEFECT AND RE-SAVE.`,
                '---',
            ].join('\n')

            if (existingContent.startsWith('---')) {
                const withoutOpening = existingContent.slice(3)
                fs.writeFileSync(
                    scratchpad.tmpFilePath,
                    `${diagnosticComment}${withoutOpening}`,
                    { encoding: 'utf-8' },
                )
            }
        }

        currentStrike++
    }

    // Evaluate Circuit Breaker Outcome
    if (!saveSuccess) {
        await emitBusConsoleLog(
            'cns00',
            `>> [FAIL] [CIRCUIT_BREAKER_TRIPPED] Human save gate failed after ${maxStrikes} strikes.`,
        )
        await emitBusConsoleLog(
            'cns00',
            `>> [FAIL] Unlinking ephemeral scratchpad: ${scratchpad.tmpFilePath}`,
        )

        if (fs.existsSync(scratchpad.tmpFilePath)) {
            try {
                fs.unlinkSync(scratchpad.tmpFilePath)
            } catch {}
        }

        const failurePayload: HumanGateResultPayload = {
            success: false,
            entityId,
            domain,
            canonicalPath: scratchpad.canonicalFilePath,
            attempts: maxStrikes,
            trippedCircuitBreaker: true,
            error: `STAGING_HUMAN_GATE_BREAKER_TRIPPED: ${lastError}`,
        }

        if (bal.slv)
            bal.slv({
                entityBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: {
                        result: failurePayload,
                        error: failurePayload.error,
                    },
                },
            })
        return cpy
    }

    // Atomic POSIX Promotion over Canonical Inode
    try {
        fs.renameSync(scratchpad.tmpFilePath, scratchpad.canonicalFilePath)
        await emitBusConsoleLog(
            'cns00',
            `>> [OK] [HUMAN_GATE] Promoted scratchpad to canonical path: ${scratchpad.canonicalFilePath}`,
        )
    } catch (err: any) {
        const errorMsg = `CANONICAL_PROMOTION_ERROR: ${err?.message || String(err)}`
        await emitBusConsoleLog('cns00', `>> [FAIL] ${errorMsg}`)
        if (bal.slv)
            bal.slv({
                entityBit: { idx: bal.idx, val: 0, dat: { error: errorMsg } },
            })
        return cpy
    }

    // Trigger Phase 5 Recompilation to seal new Merkle Root (H_root)
    let updatedMerkleRoot = ''
    try {
        const passOne = executePassOneGenesisShape(seriesSlug)
        if (passOne.passed) {
            const passTwo = executePassTwoGenesisGraph(passOne.registry)
            if (passTwo.passed) {
                const passThree = executePassThreeGenesisSeal(
                    seriesSlug,
                    passOne.seriesConfig,
                    passOne.registry,
                )
                if (passThree.passed) {
                    updatedMerkleRoot = passThree.merkleRoot
                    await emitBusConsoleLog(
                        'cns00',
                        `>> [OK] [LORE::SEAL] Resealed canonical Merkle root: ${updatedMerkleRoot.slice(0, 16)}...`,
                    )
                }
            }
        }
    } catch (err: any) {
        await emitBusConsoleLog(
            'cns00',
            `>> [WARN] [LORE::SEAL] Recompilation warning: ${err?.message || String(err)}`,
        )
    }

    const successPayload: HumanGateResultPayload = {
        success: true,
        entityId,
        domain,
        canonicalPath: scratchpad.canonicalFilePath,
        updatedMerkleRoot,
        attempts: currentStrike,
    }

    if (bal.slv) {
        bal.slv({
            entityBit: {
                idx: bal.idx,
                val: 1,
                dat: { result: successPayload },
            },
        })
    }

    return cpy
}
