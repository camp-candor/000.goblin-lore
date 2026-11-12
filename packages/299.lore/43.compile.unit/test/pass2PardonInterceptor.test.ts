import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { CompileModel } from '../compile.model.js'
import { pass2Traverse, pass3Seal } from '../buz/compile.buzz.js'
import type { PardonRecord } from '../../03.laws.unit/fce/pardon.schema.js'

describe('43.compile.unit :: Pass 2 Compiler Waiver Interceptor & Pass 3 Provenance Embedding', () => {
    let tempRepoRoot: string
    let seriesDir: string
    let worldDir: string

    beforeEach(() => {
        tempRepoRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'lore-compiler-pardon-test-'),
        )
        seriesDir = path.join(tempRepoRoot, 'series', 'test-series')
        worldDir = path.join(seriesDir, 'world')
        fs.mkdirSync(worldDir, { recursive: true })
        fs.mkdirSync(path.join(seriesDir, 'characters'), { recursive: true })
    })

    afterEach(() => {
        fs.rmSync(tempRepoRoot, { recursive: true, force: true })
    })

    it('halts Pass 2 compilation with fatal error when an unpardonable PHYSICAL waiver is present', () => {
        const illegalPardon: PardonRecord = {
            pardon_id: 'pardon_illegal_amputee_lift',
            target: {
                series_slug: 'test-series',
                episode_id: 'ep01',
                scene_id: 'sc01',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_bimanual_lift',
            authorizer_id: 'auth_showrunner_main',
            justification:
                'Allowing one-armed character to lift two-handed pipe valve.',
            granted_against_canon_hash: '0'.repeat(64),
            granted_at_epoch: 0,
        }

        fs.writeFileSync(
            path.join(worldDir, 'pardons.json'),
            JSON.stringify({ records: [illegalPardon] }),
            'utf8',
        )

        const model = new CompileModel()
        model.activeSeries = 'test-series'
        model.entityCatalog = {
            characters: { char_wart: { id: 'char_wart' } },
        }

        let resultBit: any
        pass2Traverse(model, {
            idx: 'test-unpardonable-physical',
            src: tempRepoRoot,
            seriesSlug: 'test-series',
            slv: (res: any) => {
                resultBit = res.cmpBit
            },
        })

        expect(model.status).toBe('FAILED')
        expect(resultBit.val).toBe(0)
        expect(resultBit.dat.validationReport.pardonsValid).toBe(false)
        expect(
            resultBit.dat.validationReport.errors.some((e: string) =>
                e.includes('[PASS 2 PARDON FATAL]'),
            ),
        ).toBe(true)
    })

    it('halts Pass 2 compilation when pardon references an unauthorized authorizer role', () => {
        const unauthorizedPardon: PardonRecord = {
            pardon_id: 'pardon_director_overreach',
            target: {
                series_slug: 'test-series',
                episode_id: 'ep01',
                scene_id: 'sc01',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_carrying_capacity',
            authorizer_id: 'auth_guest_director',
            justification: 'Guest director waiving logistical pack limits.',
            granted_against_canon_hash: '0'.repeat(64),
            granted_at_epoch: 0,
        }

        fs.writeFileSync(
            path.join(worldDir, 'pardons.json'),
            JSON.stringify({ records: [unauthorizedPardon] }),
            'utf8',
        )

        const model = new CompileModel()
        model.activeSeries = 'test-series'
        model.entityCatalog = {
            characters: { char_wart: { id: 'char_wart' } },
        }

        let resultBit: any
        pass2Traverse(model, {
            idx: 'test-unauthorized-authorizer',
            src: tempRepoRoot,
            seriesSlug: 'test-series',
            slv: (res: any) => {
                resultBit = res.cmpBit
            },
        })

        expect(model.status).toBe('FAILED')
        expect(resultBit.val).toBe(0)
        expect(
            resultBit.dat.validationReport.errors.some((e: string) =>
                e.includes('[PASS 2 PARDON PERMISSION DENIED]'),
            ),
        ).toBe(true)
    })

    it('passes Pass 2 and embeds verified waivers into _meta.applied_pardons in Pass 3', () => {
        const validPardon: PardonRecord = {
            pardon_id: 'pardon_tallow_emergency',
            target: {
                series_slug: 'test-series',
                episode_id: 'ep01',
                scene_id: 'sc01',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_carrying_capacity',
            authorizer_id: 'auth_showrunner_main',
            justification:
                'Temporary emergency tallow allowance for culvert siphon.',
            granted_against_canon_hash: '0'.repeat(64),
            granted_at_epoch: 0,
        }

        fs.writeFileSync(
            path.join(worldDir, 'pardons.json'),
            JSON.stringify({ records: [validPardon] }),
            'utf8',
        )

        const model = new CompileModel()
        model.activeSeries = 'test-series'
        model.entityCatalog = {
            characters: { char_wart: { id: 'char_wart' } },
        }

        let pass2Bit: any
        pass2Traverse(model, {
            idx: 'test-valid-pass2',
            src: tempRepoRoot,
            seriesSlug: 'test-series',
            slv: (res: any) => {
                pass2Bit = res.cmpBit
            },
        })

        expect(pass2Bit.val).toBe(1)
        expect(pass2Bit.dat.validationReport.pardonsValid).toBe(true)
        expect(pass2Bit.dat.validationReport.appliedPardonsCount).toBe(1)

        let pass3Bit: any
        pass3Seal(model, {
            idx: 'test-valid-pass3',
            src: tempRepoRoot,
            seriesSlug: 'test-series',
            slv: (res: any) => {
                pass3Bit = res.cmpBit
            },
        })

        expect(model.status).toBe('SEALED')
        expect(pass3Bit.val).toBe(1)
        expect(pass3Bit.rootMerkleHash).toMatch(/^[0-9a-f]{64}$/)

        const bibleState = JSON.parse(
            fs.readFileSync(
                path.join(
                    tempRepoRoot,
                    'compiled',
                    'test-series',
                    'bible-state.json',
                ),
                'utf8',
            ),
        )

        expect(bibleState._meta.applied_pardons).toBeDefined()
        expect(bibleState._meta.applied_pardons.length).toBe(1)
        expect(bibleState._meta.applied_pardons[0].pardon_id).toBe(
            'pardon_tallow_emergency',
        )
    })
})
