import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MenuModel } from '../menu.model.js'
import { promptGenreModality } from '../buz/promptGenreModality.buzz.js'
import { promptScarcityPreset } from '../buz/promptScarcityPreset.buzz.js'
import { promptAcousticFloor } from '../buz/promptAcousticFloor.buzz.js'

describe('Constitutional Tuple Wizard Choice Flows', () => {
    beforeEach(() => {
        ;(globalThis as any).LIBRARY = {
            hunt: vi.fn(),
        }
    })

    it('resolves LOW_FANTASY_FARCE with green border and 1500 bp farce cap', async () => {
        ;(globalThis as any).LIBRARY.hunt.mockImplementation(
            async (action: string) => {
                if (action.includes('Update Grid'))
                    return { grdBit: { dat: {} } }
                if (action.includes('Open Choice'))
                    return { chcBit: { src: 'LOW_FANTASY_FARCE' } }
                return {}
            },
        )

        const cpy = new MenuModel()
        let capturedResult: any = null
        const bal = {
            idx: 'test',
            slv: (res: any) => {
                capturedResult = res
            },
        }

        await promptGenreModality(cpy, bal, {} as any)
        expect(capturedResult.mnuBit.val).toBe(1)
        expect(capturedResult.mnuBit.dat.genreTag).toBe('LOW_FANTASY_FARCE')
        expect(capturedResult.mnuBit.dat.borderTheme).toBe('green')
        expect(capturedResult.mnuBit.dat.maxFarceRatioBps).toBe(1500)
    })

    it('handles cancellation gracefully in scarcity preset selector', async () => {
        ;(globalThis as any).LIBRARY.hunt.mockImplementation(
            async (action: string) => {
                if (action.includes('Update Grid'))
                    return { grdBit: { dat: {} } }
                if (action.includes('Open Choice'))
                    return { chcBit: { src: '[<] CANCEL' } }
                return {}
            },
        )

        const cpy = new MenuModel()
        let capturedResult: any = null
        const bal = {
            idx: 'test',
            slv: (res: any) => {
                capturedResult = res
            },
        }

        await promptScarcityPreset(cpy, bal, {} as any)
        expect(capturedResult.mnuBit.val).toBe(0)
        expect(capturedResult.mnuBit.dat.cancelled).toBe(true)
    })

    it('resolves acoustic partition loss preset to 1500 cdB', async () => {
        ;(globalThis as any).LIBRARY.hunt.mockImplementation(
            async (action: string) => {
                if (action.includes('Update Grid'))
                    return { grdBit: { dat: {} } }
                if (action.includes('Open Choice'))
                    return {
                        chcBit: {
                            src: 'CORRUGATED_TIN_CULVERT (1500 cdB partition loss)',
                        },
                    }
                return {}
            },
        )

        const cpy = new MenuModel()
        let capturedResult: any = null
        const bal = {
            idx: 'test',
            slv: (res: any) => {
                capturedResult = res
            },
        }

        await promptAcousticFloor(cpy, bal, {} as any)
        expect(capturedResult.mnuBit.val).toBe(1)
        expect(capturedResult.mnuBit.dat.globalAcousticFloorCdb).toBe(1500)
        expect(capturedResult.mnuBit.dat.voDuckingDb).toBe(-14)
    })
})
