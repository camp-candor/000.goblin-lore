import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import State from '../99.core/state.js'
import { CompileModel } from '../43.compile.unit/compile.model.js'
import { pass3Seal } from '../43.compile.unit/buz/compile.buzz.js'

describe('chronology compile seal', () => {
    it('seals chronology into bible-state.json', () => {
        const model = new CompileModel()
        let sealBit: any
        pass3Seal(model, {
            idx: 'test-seal-chrono',
            seriesSlug: '000.sample-hearth',
            slv: (res: any) => {
                sealBit = res.cmpBit
            },
        })
        expect(sealBit).toBeDefined()
        expect(sealBit.val).toBe(1)
        const biblePath = path.join(
            path.resolve(__dirname, '../../../'),
            'compiled/000.sample-hearth/bible-state.json',
        )
        const onDisk = JSON.parse(fs.readFileSync(biblePath, 'utf8'))
        expect(onDisk.chronology).toBeDefined()
        expect(onDisk.chronology.start_date).toBeDefined()
        expect(onDisk.chronology.start_time).toBeDefined()
        expect(onDisk.chronology.start_snapshot).toBeDefined()
    })
})
