import { describe, it, expect } from 'vitest'
import {
    OPEN_SERIES_GENESIS_WIZARD,
    OpenSeriesGenesisWizard,
    CLOSE_SERIES_GENESIS_WIZARD,
    CloseSeriesGenesisWizard,
    type Actions,
} from '../act/menu.action.js'
import type MenuBit from '../fce/menu.bit.js'

describe('98.menu.unit - Genesis Menu Actions', () => {
    it('instantiates OpenSeriesGenesisWizard with correct action type and bale payload', () => {
        const payload: MenuBit = {
            idx: 'test-genesis-open',
            src: 'wiregrass-basin',
            val: 1,
        }

        const action = new OpenSeriesGenesisWizard(payload)

        expect(action.type).toBe(OPEN_SERIES_GENESIS_WIZARD)
        expect(action.type).toBe('[Menu action] Open Series Genesis Wizard')
        expect(action.bale).toEqual(payload)
        expect(action.bale.src).toBe('wiregrass-basin')
    })

    it('instantiates CloseSeriesGenesisWizard with correct action type and bale payload', () => {
        const payload: MenuBit = {
            idx: 'test-genesis-close',
            val: 0,
        }

        const action = new CloseSeriesGenesisWizard(payload)

        expect(action.type).toBe(CLOSE_SERIES_GENESIS_WIZARD)
        expect(action.type).toBe('[Menu action] Close Series Genesis Wizard')
        expect(action.bale).toEqual(payload)
    })

    it('verifies type compatibility within the Actions union', () => {
        const actionA: Actions = new OpenSeriesGenesisWizard({
            idx: 'action-a',
        })
        const actionB: Actions = new CloseSeriesGenesisWizard({
            idx: 'action-b',
        })

        expect(actionA.type).toBeDefined()
        expect(actionB.type).toBeDefined()
    })
})
