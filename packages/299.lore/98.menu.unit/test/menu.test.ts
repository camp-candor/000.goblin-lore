import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MenuModel } from '../menu.model.js'
import {
    executeMenuChoice,
    initMenu,
    MENU_CHOICES,
    updateMenu,
} from '../buz/00.menu.buzz.js'

describe('98.menu.unit: Blessed Terminal Cockpit Integration', () => {
    let originalLibrary: any

    beforeEach(() => {
        originalLibrary = global.LIBRARY
        delete (global as any).LIBRARY
    })

    afterEach(() => {
        global.LIBRARY = originalLibrary
    })

    it('initMenu initializes state model cleanly with idx 98.menu', async () => {
        const model = new MenuModel()
        let callbackResult: any = null
        const mockState: any = { hunt: async () => ({}) }

        const res = await initMenu(
            model,
            {
                idx: 'test-init',
                slv: (r) => {
                    callbackResult = r
                },
            },
            mockState,
        )

        expect(res.idx).toBe('98.menu')
        expect(callbackResult).toBeDefined()
        expect(callbackResult.mnuBit.val).toBe(0)
    })

    it('updateMenu resolves safely headlessly when global.LIBRARY is undefined', async () => {
        const model = new MenuModel()
        let callbackResult: any = null
        const mockState: any = { hunt: async () => ({}) }

        const res = await updateMenu(
            model,
            {
                idx: 'test-update-headless',
                slv: (r) => {
                    callbackResult = r
                },
            },
            mockState,
        )

        expect(callbackResult).toBeDefined()
        expect(callbackResult.mnuBit.idx).toBe('update-menu-headless')
        expect(callbackResult.mnuBit.val).toBe(0)
    })

    it('updateMenu dispatches choices through mock LIBRARY.hunt and logs receipts', async () => {
        const loggedMessages: string[] = []
        global.LIBRARY = {
            hunt: async (action: string, payload: any) => {
                if (action.includes('Update Grid')) {
                    return { grdBit: { dat: {} } }
                }
                if (action.includes('Open Choice')) {
                    return {
                        chcBit: { src: '[ 4. AUDIT ESCALATION DAG CYCLES ]' },
                    }
                }
                if (action.includes('Update Console')) {
                    if (payload?.src) {
                        loggedMessages.push(payload.src)
                    }
                    return { cnsBit: { val: 0 } }
                }
                return {}
            },
        }

        const model = new MenuModel()
        let callbackResult: any = null
        const mockState: any = { hunt: async () => ({}) }

        await updateMenu(
            model,
            {
                idx: 'test-update-with-choice',
                slv: (r) => {
                    callbackResult = r
                },
            },
            mockState,
        )

        expect(model.activeSelection).toContain(
            '4. AUDIT ESCALATION DAG CYCLES',
        )
        expect(loggedMessages.some((msg) => msg.includes('DAG_PASS'))).toBe(
            true,
        )
        expect(callbackResult.mnuBit.val).toBe(0)
    })

    it('dispatching 4. AUDIT ESCALATION DAG CYCLES updates activeSelection and logs DAG_PASS', async () => {
        const loggedMessages: string[] = []
        global.LIBRARY = {
            hunt: async (action: string, payload: any) => {
                if (action.includes('Update Console') && payload?.src) {
                    loggedMessages.push(payload.src)
                }
                return {}
            },
        }

        const model = new MenuModel()
        const mockState: any = { hunt: async () => ({}) }

        await executeMenuChoice(
            model,
            {
                idx: 'test-choice-4',
                src: '4. AUDIT ESCALATION DAG CYCLES',
            },
            mockState,
        )

        expect(model.activeSelection).toBe('4. AUDIT ESCALATION DAG CYCLES')
        expect(loggedMessages.some((msg) => msg.includes('DAG_PASS'))).toBe(
            true,
        )
        expect(
            model.lastTelemetryReport.some((r) => r.includes('DAG_PASS')),
        ).toBe(true)
    })

    it('routes all five operational selections cleanly without errors', async () => {
        const loggedMessages: string[] = []
        global.LIBRARY = {
            hunt: async (action: string, payload: any) => {
                if (action.includes('Update Console') && payload?.src) {
                    loggedMessages.push(payload.src)
                }
                return {}
            },
        }

        const operationalChoices = [
            '1. VALIDATE SCHEMA INVARIANTS',
            '2. RUN SOMATIC SAT SOLVER',
            '3. AUDIT SPATIAL RECIPROCITY',
            '4. AUDIT ESCALATION DAG CYCLES',
            '5. VERIFY CLUE DISJOINTNESS',
            'ROOT MENU',
        ]

        const mockState: any = { hunt: async () => ({}) }

        for (const choice of operationalChoices) {
            const model = new MenuModel()
            let resBit: any = null

            await executeMenuChoice(
                model,
                {
                    idx: 'test-route',
                    src: choice,
                    slv: (r) => {
                        resBit = r
                    },
                },
                mockState,
            )

            expect(model.activeSelection).toBe(choice)
            expect(resBit.mnuBit.val).toBe(0)
        }

        // Verify receipts logged for each
        expect(loggedMessages.some((m) => m.includes('SCHEMA_OK'))).toBe(true)
        expect(
            loggedMessages.some(
                (m) => m.includes('SAT_HALT') || m.includes('SAT_PASS'),
            ),
        ).toBe(true)
        expect(loggedMessages.some((m) => m.includes('PORTAL_OK'))).toBe(true)
        expect(loggedMessages.some((m) => m.includes('DAG_PASS'))).toBe(true)
        expect(loggedMessages.some((m) => m.includes('CLUE_OK'))).toBe(true)
        expect(loggedMessages.some((m) => m.includes('ROOT'))).toBe(true)
    })
})
