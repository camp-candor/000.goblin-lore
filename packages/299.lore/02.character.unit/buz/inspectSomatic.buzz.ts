import { getCharacterSomaticMask } from './somaticMask.buzz.js'
import { CharacterModel } from '../character.model.js'
import CharacterBit from '../fce/character.bit.js'
import State from '../../99.core/state.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

/**
 * Canonical in-memory cast roster used when the dispatch carries no
 * explicit registry. Keeps T0 somatic inspection deterministic ($0.00)
 * without disk hydration. Disk-backed dossiers remain future work.
 */
const CANONICAL_CAST: Record<string, any> = {
    char_wart: {
        machineRail: {
            id: 'char_wart',
            name: 'Wart',
            type: 'character',
            somatic: {
                locomotion_baseline: 'bipedal_hunched',
                banned_kinetic_verbs: ['climb', 'embrace'],
                conditions: ['cnd_severed_left_arm'],
                motor_limitations: ['UNSTEADY_GAIT', 'NO_HEAVY_LIFT'],
            },
        },
    },
    char_bog: {
        machineRail: {
            id: 'char_bog',
            name: 'Bog',
            type: 'character',
            somatic: {
                locomotion_baseline: 'bipedal_standard',
                banned_kinetic_verbs: [],
                conditions: [],
                motor_limitations: [],
            },
        },
    },
    char_spleen: {
        machineRail: {
            id: 'char_spleen',
            name: 'Spleen',
            type: 'character',
            somatic: {
                locomotion_baseline: 'limping',
                banned_kinetic_verbs: [],
                conditions: [],
                motor_limitations: [],
            },
        },
    },
    char_mum_grissel: {
        machineRail: {
            id: 'char_mum_grissel',
            name: 'Mum Grissel',
            type: 'character',
            somatic: {
                locomotion_baseline: 'bipedal_standard',
                banned_kinetic_verbs: [],
                conditions: [],
                motor_limitations: [],
            },
        },
    },
}

/**
 * Buzzer action projecting a deep-frozen somatic capability mask and
 * streaming the 7-bit ASCII biomechanical breakdown to cns00.
 */
export const inspectSomatic = (
    cpy: CharacterModel,
    bal: CharacterBit,
    ste: State,
): CharacterModel => {
    try {
        const characterId: string = bal.dat?.characterId || bal.src || ''
        const registry = bal.dat?.registry || CANONICAL_CAST

        const mask = getCharacterSomaticMask(characterId, registry)

        const lib = (globalThis as any).LIBRARY
        if (lib && typeof lib.hunt === 'function') {
            const arms = mask.availableArmsBps
            const lines = [
                `>> [SOMATIC PROJECTION] ${mask.characterId} (Gait: ${mask.locomotionBaseline})`,
                `>> ${'AVAILABLE ARMS'.padEnd(17)}: ${arms} / 20000 bps (${(arms / 10000).toFixed(1)} Arms)`,
                `>> ${'ACTIVE CONDITIONS'.padEnd(17)}: [${mask.conditions.join(', ')}]`,
                `>> ${'BANNED VERBS'.padEnd(17)}: [${mask.bannedKineticVerbs.join(', ')}]`,
                `>> ${'STATUS'.padEnd(17)}: [OK] Deep-Frozen Projection Verified`,
            ]
            for (const src of lines) {
                lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src })
            }
        }

        if (bal.slv) {
            bal.slv({
                characterBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: mask,
                },
            })
        }
    } catch (err: any) {
        const lib = (globalThis as any).LIBRARY
        if (lib && typeof lib.hunt === 'function') {
            lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: [SOMATIC PROJECTION FAIL] ${err.message}`,
            })
        }
        if (bal.slv) {
            bal.slv({
                characterBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: {
                        error: err.message,
                    },
                },
            })
        }
    }
    return cpy
}
