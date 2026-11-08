import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageRoot = path.resolve(__dirname, '..')

function sweepDirectory(dir: string, fileList: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        if (
            entry.name === 'node_modules' ||
            entry.name === 'dist' ||
            entry.name === '.git'
        ) {
            continue
        }
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            sweepDirectory(fullPath, fileList)
        } else if (
            entry.isFile() &&
            (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
        ) {
            fileList.push(fullPath)
        }
    }
    return fileList
}

describe('Phase 1 Local Unit Boilerplate Hygiene Sentinel', () => {
    it('verifies packages/299.lore/src does not exist on disk', () => {
        const srcDir = path.join(packageRoot, 'src')
        expect(fs.existsSync(srcDir)).toBe(false)
    })

    it('asserts zero debug traps exist across all TypeScript source files', () => {
        const tsFiles = sweepDirectory(packageRoot)
        expect(tsFiles.length).toBeGreaterThanOrEqual(100)

        const violatingFiles: { file: string; line: number; text: string }[] =
            []
        const debuggerRegex = new RegExp(
            '\\b' + ['deb', 'ugger'].join('') + '\\b',
        )

        for (const filePath of tsFiles) {
            if (filePath === __filename) {
                continue
            }
            const content = fs.readFileSync(filePath, 'utf8')
            if (debuggerRegex.test(content)) {
                const lines = content.split('\n')
                lines.forEach((line, idx) => {
                    if (debuggerRegex.test(line)) {
                        violatingFiles.push({
                            file: path
                                .relative(packageRoot, filePath)
                                .replace(/\\/g, '/'),
                            line: idx + 1,
                            text: line.trim(),
                        })
                    }
                })
            }
        }

        expect(violatingFiles).toEqual([])
    })

    it('asserts zero dead Ollama API calls exist in 00.lore.unit', () => {
        const loreBuzzPath = path.join(
            packageRoot,
            '00.lore.unit/buz/lore.buzz.ts',
        )
        const content = fs.readFileSync(loreBuzzPath, 'utf8')
        expect(content.includes('lore.list()')).toBe(false)
        expect(content.includes('list-lore')).toBe(false)
    })

    it('verifies model classes declare explicit idx and bit storage properties', async () => {
        const { LawsModel } = await import('../03.laws.unit/laws.model.js')
        const model = new LawsModel()
        expect(model.idx).toBe('03.laws')
        expect(Array.isArray(model.lawsBitList)).toBe(true)
        expect(typeof model.lawsBits).toBe('object')
    })
})
