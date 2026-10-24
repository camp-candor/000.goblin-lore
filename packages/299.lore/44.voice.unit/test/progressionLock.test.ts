import { describe, it, expect } from 'vitest'
import {
    checkProgressionLock,
    resolveProgressionLock,
} from '../buz/progressionLock.buzz'
import { VoiceModel } from '../voice.model'

describe('44.voice.unit: Showrunner Progression Task Lock Enforcer', () => {
    it('allows simulation advancement when pending_showrunner_task is null', () => {
        let result: any = null
        const model = new VoiceModel()

        checkProgressionLock(
            model,
            {
                idx: 'char_spleen',
                dat: {
                    level: 1,
                    xp: 45,
                    xp_per_cycle_survived: 10,
                    xp_bonus_no_backfire: 5,
                    pending_showrunner_task: null,
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.vceBit.val).toBe(1)
        expect(result.vceBit.dat.isValid).toBe(true)
        expect(result.vceBit.dat.isLocked).toBe(false)
        expect(result.vceBit.dat.status).toBe('UNLOCKED_SIMULATION_PERMITTED')
        expect(result.vceBit.dat.simulationPermitted).toBe(true)
    })

    it('blocks simulation advancement when pending_showrunner_task is active', () => {
        let result: any = null
        const model = new VoiceModel()

        checkProgressionLock(
            model,
            {
                idx: 'char_spleen',
                dat: {
                    level: 2,
                    xp: 150,
                    xp_per_cycle_survived: 10,
                    xp_bonus_no_backfire: 5,
                    pending_showrunner_task: 'class_shift_150',
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.vceBit.val).toBe(0)
        expect(result.vceBit.dat.isValid).toBe(true)
        expect(result.vceBit.dat.isLocked).toBe(true)
        expect(result.vceBit.dat.status).toBe('LOCKED_PENDING_SHOWRUNNER')
        expect(result.vceBit.dat.simulationPermitted).toBe(false)
        expect(result.vceBit.dat.pendingTask).toBe('class_shift_150')
    })

    it('fails closed on invalid task string formatting', () => {
        let result: any = null
        const model = new VoiceModel()

        checkProgressionLock(
            model,
            {
                idx: 'char_bog',
                dat: {
                    pending_showrunner_task: 'INVALID TASK WITH SPACES!',
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.vceBit.val).toBe(0)
        expect(result.vceBit.dat.isValid).toBe(false)
        expect(result.vceBit.dat.errorCode).toBe(
            'INVALID_SHOWRUNNER_TASK_FORMAT_BREACH',
        )
        expect(result.vceBit.dat.simulationPermitted).toBe(false)
    })

    it('validates resolution of a valid showrunner task token', () => {
        let result: any = null
        const model = new VoiceModel()

        resolveProgressionLock(
            model,
            {
                idx: 'char_spleen',
                src: 'class_shift_150',
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.vceBit.val).toBe(1)
        expect(result.vceBit.dat.resolved).toBe(true)
        expect(result.vceBit.dat.resolvedTask).toBe('class_shift_150')
    })

    it('fails resolution on malformed input trap', () => {
        let result: any = null
        const model = new VoiceModel()

        resolveProgressionLock(
            model,
            {
                idx: 'char_spleen',
                src: 'ab',
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.vceBit.val).toBe(0)
        expect(result.vceBit.dat.resolved).toBe(false)
        expect(result.vceBit.dat.errorCode).toBe('INVALID_SHOWRUNNER_TASK_FORMAT_BREACH')
    })
});
