import { describe, it, expect, vi } from 'vitest'
import { VoiceModel } from '../voice.model'
import { initVoice, updateVoice, parseVoiceRail } from '../buz/voice.buzz'
import { reducer } from '../voice.reduce'
import { InitVoice, UpdateVoice, ParseVoiceRail } from '../voice.action'
import type State from '../../99.core/state'

describe('44.voice.unit: Voice Unit Seven-File Anatomy Registration', () => {
    const mockState = {} as State

    it('initVoice resolves with { idx: "init-voice", val: 1 }', () => {
        const model = new VoiceModel()
        const slv = vi.fn()
        const bal = { idx: 'test-init', slv }

        const result = initVoice(model, bal, mockState)
        expect(result).toBe(model)
        expect(slv).toHaveBeenCalledWith({
            vceBit: { idx: 'init-voice', val: 1 },
        })
    })

    it('parseVoiceRail returns val: 1 when all five required Markdown headings are present', () => {
        const model = new VoiceModel()
        const slv = vi.fn()
        const markdown = [
            '# Character: Wart',
            '## Wants (surface)',
            'Fix the boiler gasket.',
            '## Wants (actual)',
            'Avoid being thrown into the grease sump.',
            '## Blind spot',
            'Does not realize Bog is equally terrified.',
            '## Voice notes',
            'Monosyllabic grunts, short defensive deflections.',
            '## Few-shot lines',
            '- "Pipes leak. Not my fault."',
            '- "Ask Bog about the wrench."',
        ].join('\n')

        const bal = { idx: 'test-parse-valid', src: markdown, slv }
        parseVoiceRail(model, bal, mockState)

        expect(slv).toHaveBeenCalledWith({
            vceBit: {
                idx: 'parse-voice-rail',
                val: 1,
                dat: {
                    hasSurfaceWant: true,
                    hasActualWant: true,
                    hasBlindSpot: true,
                    hasVoiceNotes: true,
                    hasFewShot: true,
                    isValid: true,
                },
            },
        })
    })

    it('parseVoiceRail returns val: 0 when any mandatory section is missing', () => {
        const model = new VoiceModel()
        const slv = vi.fn()
        const incompleteMarkdown = [
            '# Character: Wart',
            '## Wants (surface)',
            'Fix the boiler gasket.',
            '## Wants (actual)',
            'Avoid being thrown into the grease sump.',
            '## Voice notes',
            'Monosyllabic grunts.',
            '## Few-shot lines',
            '- "Pipes leak."',
            // Missing: ## Blind spot
        ].join('\n')

        const bal = { idx: 'test-parse-invalid', src: incompleteMarkdown, slv }
        parseVoiceRail(model, bal, mockState)

        expect(slv).toHaveBeenCalledWith({
            vceBit: {
                idx: 'parse-voice-rail',
                val: 0,
                dat: {
                    hasSurfaceWant: true,
                    hasActualWant: true,
                    hasBlindSpot: false,
                    hasVoiceNotes: true,
                    hasFewShot: true,
                    isValid: false,
                },
            },
        })
    })

    it('state mutations are non-destructive and use clone-deep in reducer', () => {
        const initialModel = new VoiceModel()
        initialModel.voiceBitList.push({ idx: 'sentinel' })

        const slv = vi.fn()
        const action = new UpdateVoice({
            idx: 'test-update',
            dat: { sample: 'payload' },
            slv,
        })

        const nextModel = reducer(initialModel, action, mockState)

        expect(nextModel).not.toBe(initialModel)
        expect(nextModel.voiceBitList).toEqual(initialModel.voiceBitList)
        expect(slv).toHaveBeenCalledWith({
            vceBit: { idx: 'update-voice', dat: { sample: 'payload' } },
        })
    })

    it('reducer handles InitVoice and ParseVoiceRail actions cleanly', () => {
        const model = new VoiceModel()
        const slvInit = vi.fn()
        const initAct = new InitVoice({ idx: 'init-test', slv: slvInit })
        reducer(model, initAct, mockState)
        expect(slvInit).toHaveBeenCalledWith({
            vceBit: { idx: 'init-voice', val: 1 },
        })

        const slvParse = vi.fn()
        const parseAct = new ParseVoiceRail({
            idx: 'parse-test',
            src: '## Wants (surface)\n## Wants (actual)\n## Blind spot)\n## Voice notes\n## Few-shot lines',
            slv: slvParse,
        })
        reducer(model, parseAct, mockState)
        expect(slvParse).toHaveBeenCalledWith({
            vceBit: expect.objectContaining({
                idx: 'parse-voice-rail',
                val: 1,
            }),
        })
    })
})
