import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { scanVoidState } from '../buz/series.discovery.buzz.js'

describe('299.lore - [Feature 1.1] Series Disk Discovery & Target Selection', () => {
    let tempRepoRoot: string

    afterEach(() => {
        if (tempRepoRoot && fs.existsSync(tempRepoRoot)) {
            fs.rmSync(tempRepoRoot, { recursive: true, force: true })
        }
    })

    it('detects void state when series/ directory is absent or empty', () => {
        tempRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'void-test-'))
        const scan = scanVoidState(tempRepoRoot)

        expect(scan.isVoidState).toBe(true)
        expect(scan.discoveredSlugs).toEqual([])
    })

    it('discovers valid series namespaces containing series.config.json', () => {
        tempRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'discovery-test-'))
        const seriesDir = path.join(
            tempRepoRoot,
            'series',
            'gotham-trinity-crisis',
        )
        fs.mkdirSync(seriesDir, { recursive: true })
        fs.writeFileSync(
            path.join(seriesDir, 'series.config.json'),
            JSON.stringify({
                series_slug: 'gotham-trinity-crisis',
                schema_version: '1.0.0',
            }),
            'utf-8',
        )

        const scan = scanVoidState(tempRepoRoot)

        expect(scan.isVoidState).toBe(false)
        expect(scan.discoveredSlugs).toContain('gotham-trinity-crisis')
    })
})
