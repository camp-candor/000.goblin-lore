/**
 * apps/dashboard/scripts/verify-ascii.mjs
 *
 * Pure 7-Bit Clean ASCII Verification Tool.
 * Scans apps/dashboard source trees for non-ASCII bytes (> 0x7F).
 * Pure 7-bit clean ASCII compliance strictly enforced.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const TARGET_DIRECTORIES = ['src', 'test']
const VALID_EXTENSIONS = ['.astro', '.tsx', '.ts', '.mjs', '.css', '.json']

let totalFilesChecked = 0
let totalViolations = 0

function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return

    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            if (
                entry.name !== 'node_modules' &&
                entry.name !== 'dist' &&
                entry.name !== '.astro'
            ) {
                scanDirectory(fullPath)
            }
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name)
            if (VALID_EXTENSIONS.includes(ext)) {
                checkFile(fullPath)
            }
        }
    }
}

function checkFile(filePath) {
    totalFilesChecked++
    const buffer = fs.readFileSync(filePath)
    const relativePath = path.relative(rootDir, filePath)

    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] > 0x7f) {
            console.error(
                `:: [FAIL] Non-ASCII byte 0x${buffer[i].toString(16).toUpperCase()} detected in ${relativePath} at byte offset ${i}`,
            )
            totalViolations++
            return
        }
    }
}

console.log(
    '>> [ASCII CHECK] Starting 7-bit compliance scan across apps/dashboard...',
)
for (const subDir of TARGET_DIRECTORIES) {
    scanDirectory(path.join(rootDir, subDir))
}

if (totalViolations > 0) {
    console.error(
        `:: [FAIL] ASCII compliance check failed with ${totalViolations} file violations.`,
    )
    process.exit(1)
}

console.log(
    `>> [OK] 100% 7-Bit Clean ASCII verified across ${totalFilesChecked} files in apps/dashboard.`,
)
process.exit(0)
