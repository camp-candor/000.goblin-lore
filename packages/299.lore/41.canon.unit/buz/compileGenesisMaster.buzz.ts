import { executePassOneGenesisShape } from './passOneGenesisShape.buzz.js'
import { executePassTwoGenesisGraph } from './passTwoGenesisGraph.buzz.js'
import { executePassThreeGenesisSeal } from './passThreeGenesisSeal.buzz.js'
import { writeWormSnapshot } from './writeWormSnapshot.buzz.js'
import {
    streamGenesisSealStart,
    streamPassOneReceipt,
    streamPassTwoReceipt,
    streamPassThreeReceipt,
    streamCompilationFailure,
} from '../../33.stream.unit/buz/streamGenesisSeal.buzz.js'
import type CompileGenesisBit from '../fce/compileGenesis.bit.js'
import type { CanonModel } from '../canon.model.js'
import type State from '../../99.core/state.js'

export const compileGenesisMaster = async (
    cpy: CanonModel,
    bal: CompileGenesisBit,
    _ste: State,
): Promise<CanonModel> => {
    const seriesSlug = bal.src || bal.dat?.seriesSlug
    if (!seriesSlug) {
        await streamCompilationFailure('INIT', 'Missing series slug parameter')
        if (bal.slv)
            bal.slv({
                canonBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: 'MISSING_SERIES_SLUG' },
                },
            })
        return cpy
    }

    await streamGenesisSealStart(seriesSlug)

    // Pass 1: Shape & Byte-0 Sweeper
    const passOne = executePassOneGenesisShape(seriesSlug)
    if (!passOne.passed) {
        await streamCompilationFailure(
            'PASS_1_SHAPE',
            passOne.error || 'Unknown shape error',
        )
        if (bal.slv)
            bal.slv({
                canonBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: passOne.error },
                },
            })
        return cpy
    }
    await streamPassOneReceipt(passOne.totalEntities)

    // Pass 2: Foreign-Key & DAG Acyclicity Sweeper
    const passTwo = executePassTwoGenesisGraph(passOne.registry)
    if (!passTwo.passed) {
        await streamCompilationFailure(
            'PASS_2_GRAPH',
            passTwo.error || 'Unknown graph error',
        )
        if (bal.slv)
            bal.slv({
                canonBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: passTwo.error },
                },
            })
        return cpy
    }
    await streamPassTwoReceipt()

    // Pass 3: RFC 8785 Canonicalizer & Atomic Sealer
    const passThree = executePassThreeGenesisSeal(
        seriesSlug,
        passOne.seriesConfig,
        passOne.registry,
    )
    if (!passThree.passed) {
        await streamCompilationFailure(
            'PASS_3_SEAL',
            passThree.error || 'Unknown seal error',
        )
        if (bal.slv)
            bal.slv({
                canonBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: passThree.error },
                },
            })
        return cpy
    }

    // Dual-Emission WORM Archive
    const worm = writeWormSnapshot(seriesSlug, passThree.compiledState)
    if (!worm.passed) {
        await streamCompilationFailure(
            'WORM_SNAPSHOT',
            worm.error || 'Unknown WORM error',
        )
        if (bal.slv)
            bal.slv({
                canonBit: { idx: bal.idx, val: 0, dat: { error: worm.error } },
            })
        return cpy
    }

    await streamPassThreeReceipt(
        passThree.merkleRoot,
        passThree.canonicalHeadPath,
        worm.wormPath,
    )

    if (bal.slv) {
        bal.slv({
            canonBit: {
                idx: bal.idx,
                val: 1,
                dat: {
                    result: {
                        seriesSlug,
                        merkleRoot: passThree.merkleRoot,
                        canonicalHeadPath: passThree.canonicalHeadPath,
                        wormArchivePath: worm.wormPath,
                        totalEntities: passOne.totalEntities,
                    },
                },
            },
        })
    }

    return cpy
}
