import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CharacterModel } from '../character.model.js'
import { reducer } from '../character.reduce.js'
import * as Act from '../character.action.js'

describe('02.character.unit: Inspect Somatic Mask Telemetry', () => {
    let originalLibrary: any

    beforeEach(() => {
        originalLibrary = (globalThis as any).LIBRARY
        delete (globalThis as any).LIBRARY
    })

    afterEach(() => {
        if (originalLibrary !== undefined) {
            ;(globalThis as any).LIBRARY = originalLibrary
        } else {
            delete (globalThis as any).LIBRARY
        }
    })

    it('emits the exact Step 5.3 SOMATIC PROJECTION block for char_wart', () => {
        const lines: string[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: (action: string, dat: any) => {
                if (action === '[Console action] Update Console') {
                    lines.push(dat.src)
                }
                return {}
            },
        }

        let resolved: any = null
        const action = new Act.InspectSomatic({
            src: 'under-the-floorboards',
            dat: { characterId: 'char_wart' },
            slv: (res: any) => {
                resolved = res
            },
        } as any)

        reducer(new CharacterModel(), action)

        expect(lines).toEqual([
            '>> [SOMATIC PROJECTION] char_wart (Gait: bipedal_hunched)',
            '>> AVAILABLE ARMS   : 10000 / 20000 bps (1.0 Arms)',
            '>> ACTIVE CONDITIONS: [cnd_severed_left_arm]',
            '>> BANNED VERBS     : [bimanual_lift, climb, dual_wield, embrace, two_handed_strike]',
            '>> STATUS           : [OK] Deep-Frozen Projection Verified',
        ])
        expect(resolved?.characterBit?.val).toBe(1)
        expect(resolved?.characterBit?.dat?.characterId).toBe('char_wart')
        expect(resolved?.characterBit?.dat?.availableArmsBps).toBe(10000)
    })

    it('headless bypass resolves the mask without LIBRARY or throw', () => {
        let resolved: any = null
        const action = new Act.InspectSomatic({
            src: 'under-the-floorboards',
            dat: { characterId: 'char_wart' },
            slv: (res: any) => {
                resolved = res
            },
        } as any)

        expect(() => reducer(new CharacterModel(), action)).not.toThrow()
        expect(resolved?.characterBit?.val).toBe(1)
    })

    it('fails closed with explicit error on unknown character ID', () => {
        const lines: string[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: (action: string, dat: any) => {
                if (action === '[Console action] Update Console') {
                    lines.push(dat.src)
                }
                return {}
            },
        }

        let resolved: any = null
        const action = new Act.InspectSomatic({
            src: 'under-the-floorboards',
            dat: { characterId: 'char_ghost' },
            slv: (res: any) => {
                resolved = res
            },
        } as any)

        reducer(new CharacterModel(), action)

        expect(resolved?.characterBit?.val).toBe(0)
        expect(resolved?.characterBit?.dat?.error).toMatch(
            /Unknown character ID: 'char_ghost'/,
        )
        expect(lines.length).toBe(1)
        expect(lines[0]).toContain(':: [SOMATIC PROJECTION FAIL]')
    })
})
