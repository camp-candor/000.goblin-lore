/**
 * packages/299.lore/test/compile-menu.test.ts
 *
 * Vitest verification suite for Blessed terminal compile menu flight deck,
 * ste.hunt dispatching to 21.compile.unit, and cns00 telemetry streaming.
 */

import { describe, it, expect } from 'vitest'
import sinon from 'sinon'
import State from '../99.core/state'
import { MenuModel } from '../98.menu.unit/menu.model'
import {
    updateMenu,
    openCompileMenu,
    triggerCompileAction,
} from '../98.menu.unit/buz/00.menu.buzz'
import { COMPILE_MENU_OPTIONS } from '../98.menu.unit/compile-menu.view'

describe('299.lore - Compile Menu Flight Deck & Telemetry Suite', () => {
    it('updateMenu -- includes [C] COMPILE CANON & GATE 0 GAUNTLET option', async () => {
        let resolved: any = null
        const bal = {
            idx: 'test-menu',
            slv: (res: any) => {
                resolved = res
            },
        }

        const model = new MenuModel()
        await updateMenu(model, bal as any, undefined as any)

        expect(resolved).toBeTruthy()
        expect(resolved.mnuBit.lst).toContain(
            '[C] COMPILE CANON & GATE 0 GAUNTLET',
        )
    })

    it('openCompileMenu -- exposes all 5 compiler actions and return option', async () => {
        let resolved: any = null
        const bal = {
            idx: 'test-open-compile',
            dat: { activeSeries: '001.goblin-lore' },
            slv: (res: any) => {
                resolved = res
            },
        }

        const model = new MenuModel()
        await openCompileMenu(model, bal as any, undefined as any)

        expect(resolved).toBeTruthy()
        expect(resolved.mnuBit.lst.length).toBe(COMPILE_MENU_OPTIONS.length)
        expect(resolved.mnuBit.lst[0]).toContain(
            'RUN COMPLETE THREE-PASS GAUNTLET',
        )
        expect(resolved.mnuBit.lst[4]).toContain('GATE 0 VERIFICATION AUDIT')
        expect(resolved.mnuBit.lst[5]).toContain('RETURN TO LORE MENU')
    })

    it('triggerCompileAction -- dispatches to 21.compile.unit via ste.hunt and logs telemetry', async () => {
        let resolved: any = null
        const bal = {
            idx: 'test-dispatch-compile',
            val: 0, // Option 0: RUN COMPLETE THREE-PASS GAUNTLET
            dat: { activeSeries: '001.goblin-lore' },
            slv: (res: any) => {
                resolved = res
            },
        }

        const loggedLines: string[] = []
        const mockSte: any = {
            hunt: sinon.spy(async (actionType: string, payload: any) => {
                if (payload?.src) loggedLines.push(payload.src)
                // Simulate successful compiler response via bal.slv callback
                if (payload?.slv) {
                    payload.slv({
                        resBit: {
                            rootMerkleHash:
                                '8f14c0a9e72b3815c4d12239abcdef0123456789',
                            canonicalPath:
                                'compiled/001.goblin-lore/bible-state.json',
                            archivePath:
                                'compiled/001.goblin-lore/bible-state_2026-10-30.json',
                            catalogSummary: {
                                totalEntities: 22,
                                characterCount: 4,
                                locationCount: 4,
                                possessionCount: 6,
                                grievanceCount: 8,
                            },
                            validationReport: {
                                evaluatedFiles: 4,
                                failures: [],
                                warnings: [],
                            },
                        },
                    })
                }
                return {}
            }),
        }

        const model = new MenuModel()
        await triggerCompileAction(model, bal as any, mockSte)

        expect(resolved).toBeTruthy()
        expect(resolved.mnuBit.val).toBe(0)
        expect(resolved.mnuBit.dat.success).toBe(true)
        expect(resolved.mnuBit.dat.action).toBe(
            '[Compile action] Run Complete Gauntlet',
        )

        // Verify rich telemetry output stream
        expect(loggedLines.some((l) => l.includes('[COMPILE:DISPATCH]'))).toBe(
            true,
        )
        expect(loggedLines.some((l) => l.includes('[SEAL:MERKLE_ROOT]'))).toBe(
            true,
        )
        expect(
            loggedLines.some((l) =>
                l.includes('8f14c0a9e72b3815c4d12239abcdef0123456789'),
            ),
        ).toBe(true)
        expect(
            loggedLines.some((l) => l.includes('[SNAPSHOT:CANONICAL]')),
        ).toBe(true)
        expect(
            loggedLines.some((l) => l.includes('[CATALOG] Entities: 22')),
        ).toBe(true)
    })

    it('triggerCompileAction -- handles compiler errors with failure report', async () => {
        let resolved: any = null
        const bal = {
            idx: 'test-dispatch-error',
            val: 0,
            dat: { activeSeries: '001.goblin-lore' },
            slv: (res: any) => {
                resolved = res
            },
        }

        const loggedLines: string[] = []
        const mockSte: any = {
            hunt: sinon.spy(async (actionType: string, payload: any) => {
                if (payload?.src) loggedLines.push(payload.src)
                if (payload?.slv) {
                    payload.slv({
                        errBit: {
                            code: 'SOMATIC_SAT_BREACH',
                            message: 'Limb inequality violated for char_wart',
                            failures: [
                                {
                                    gate: 'PASS_1_SOMATIC',
                                    message: 'Held items exceed arms',
                                    targetFile: 'corpus/char_wart.md',
                                },
                            ],
                        },
                    })
                }
                return {}
            }),
        }

        const model = new MenuModel()
        await triggerCompileAction(model, bal as any, mockSte)

        expect(resolved).toBeTruthy()
        expect(resolved.mnuBit.val).toBe(-1)
        expect(resolved.mnuBit.dat.success).toBe(false)
        expect(loggedLines.some((l) => l.includes('[COMPILE:FAILED]'))).toBe(
            true,
        )
        expect(loggedLines.some((l) => l.includes('SOMATIC_SAT_BREACH'))).toBe(
            true,
        )
    })

    it('triggerCompileAction -- navigates back when return option is selected', async () => {
        let resolved: any = null
        const bal = {
            idx: 'test-return',
            val: 5, // Option 5 is [<] RETURN TO LORE MENU
            slv: (res: any) => {
                resolved = res
            },
        }

        const loggedLines: string[] = []
        const mockSte: any = {
            hunt: sinon.spy(async (actionType: string, payload: any) => {
                if (payload?.src) loggedLines.push(payload.src)
                return {}
            }),
        }

        const model = new MenuModel()
        await triggerCompileAction(model, bal as any, mockSte)

        expect(resolved).toBeTruthy()
        expect(
            loggedLines.some((l) => l.includes('Returning to Lore Menu')),
        ).toBe(true)
        expect(resolved.mnuBit.lst).toContain(
            '[C] COMPILE CANON & GATE 0 GAUNTLET',
        )
    })

    it('triggerCompileAction -- integrates end-to-end with live 43.compile.unit registered in 299.lore BEE State', async () => {
        const liveState = new State()
        let resolved: any = null
        const bal = {
            idx: 'test-live-bee-compile',
            val: 0, // [1] RUN COMPLETE THREE-PASS GAUNTLET
            dat: { activeSeries: '000.sample-hearth' },
            slv: (res: any) => {
                resolved = res
            },
        }

        const model = new MenuModel()
        await triggerCompileAction(model, bal as any, liveState)

        expect(resolved).toBeTruthy()
        expect(resolved.mnuBit.val).toBe(0)
        expect(resolved.mnuBit.dat.success).toBe(true)
        expect(resolved.mnuBit.dat.resBit?.rootMerkleHash).toMatch(
            /^[a-f0-9]{64}$/,
        )
        expect(resolved.mnuBit.dat.resBit?.catalogSummary?.totalEntities).toBe(
            6,
        )
    })

    it('openCompileMenu -- interactively prompts operator for series selection in Blessed before enabling options 1-5', async () => {
        let choiceCount = 0
        const choicesPresented: string[][] = []
        const consoleMessages: string[] = []

        const mockLibrary = {
            hunt: sinon.spy(async (action: string, payload: any) => {
                if (action === '[Grid action] Update Grid') {
                    return { grdBit: { dat: { x: 0, y: 4 } } }
                }
                if (action === '[Console action] Update Console') {
                    if (payload?.src) consoleMessages.push(payload.src)
                    return {}
                }
                if (action === '[Open action] Open Choice') {
                    choiceCount++
                    choicesPresented.push(payload.lst)
                    if (choiceCount === 1) {
                        // First choice dialog: Series selection prompt
                        return { chcBit: { src: '[S] lving-treee' } }
                    }
                    if (choiceCount === 2) {
                        // Second choice dialog: Compile options 1-5
                        return {
                            chcBit: {
                                src: '[1] RUN COMPLETE THREE-PASS GAUNTLET',
                            },
                        }
                    }
                }
                return {}
            }),
        }

        ;(globalThis as any).LIBRARY = mockLibrary
        try {
            const model = new MenuModel()
            const bal = {
                idx: 'test-interactive-compile',
                dat: {},
                slv: sinon.spy(),
            }

            await openCompileMenu(model, bal as any, undefined as any)

            // Assert that the first choice dialog was series selection
            expect(choicesPresented.length).toBe(2)
            expect(
                choicesPresented[0].some((c) => c.includes('lving-treee')),
            ).toBe(true)
            expect(choicesPresented[0]).toContain('[ CUSTOM SERIES SLUG ]')
            expect(choicesPresented[0]).toContain('[<] CANCEL')

            // Assert that model.activeSeries was updated
            expect(model.activeSeries).toBe('lving-treee')

            // Assert that the second choice dialog presented the 1-5 compile options
            expect(choicesPresented[1].length).toBe(COMPILE_MENU_OPTIONS.length)
            expect(choicesPresented[1][0]).toBe(COMPILE_MENU_OPTIONS[0].label)

            // Assert console logged target series locked
            expect(
                consoleMessages.some((msg) =>
                    msg.includes('Target series selected: lving-treee'),
                ),
            ).toBe(true)
        } finally {
            delete (globalThis as any).LIBRARY
        }
    })
})
