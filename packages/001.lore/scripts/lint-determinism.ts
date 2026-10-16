// packages/001.lore/scripts/lint-determinism.ts
import * as fs from 'node:fs'
import * as path from 'node:path'

export const DETERMINISM_TAG = '[LORE::DETERMINISM]' as const

export interface DeterminismViolation {
    filePath: string
    line: number
    ruleId:
        | 'BAN_WALL_CLOCK'
        | 'BAN_MATH_RANDOM'
        | 'BAN_PROCESS_ENV'
        | 'BAN_NETWORK_IO'
        | 'BAN_MTIME_STAT'
        | 'BAN_NON_ASCII'
    snippet: string
    message: string
}

interface ForbiddenPatternRule {
    ruleId: DeterminismViolation['ruleId']
    regex: RegExp
    message: string
}

const FORBIDDEN_RULES: readonly ForbiddenPatternRule[] = [
    {
        ruleId: 'BAN_WALL_CLOCK',
        regex: /\b(?:Date\.now\s*\(|new\s+Date\s*\(|performance\.now\s*\()/g,
        message:
            'Ambient wall-clock calls (Date.now, new Date, performance.now) are banned. Use monotonic integer versions or logical epochs.',
    },
    {
        ruleId: 'BAN_MATH_RANDOM',
        regex: /\bMath\.random\s*\(/g,
        message:
            'Unseeded Math.random() is banned in canonical schemas and compilers.',
    },
    {
        ruleId: 'BAN_PROCESS_ENV',
        regex: /\bprocess\.env\b/g,
        message:
            'Ambient process.env reads are banned to prevent environment-dependent compilation drift.',
    },
    {
        ruleId: 'BAN_NETWORK_IO',
        regex: /\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|http\.request|https\.request)/g,
        message:
            'Network I/O is strictly forbidden inside the offline legislative compiler and schema layer.',
    },
    {
        ruleId: 'BAN_MTIME_STAT',
        regex: /\.(?:mtime|mtimeMs|ctime|ctimeMs|birthtime|birthtimeMs)\b/g,
        message:
            'Filesystem modification timestamps (mtime/ctime) are banned for staleness evaluation. Use monotonic integer versions.',
    },
    {
        ruleId: 'BAN_NON_ASCII',
        regex: /[^\x00-\x7F]/g,
        message:
            'Non-ASCII characters or multi-byte UTF-8 emojis detected. Enforce pure 7-bit ASCII telemetry.',
    },
]

/**
 * Strips single-line and multi-line comments for code token scanning while preserving line numbers,
 * EXCEPT for the 7-bit ASCII check which scans every raw byte including comments.
 */
function stripCommentsPreservingLines(source: string): string {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
        .replace(/\/\/.*$/gm, '')
}

/**
 * Scans a single TypeScript/JavaScript source string for determinism and 7-bit ASCII violations.
 */
export function scanSourceForDeterminismViolations(
    sourceText: string,
    filePath = 'inline.ts',
): DeterminismViolation[] {
    const violations: DeterminismViolation[] = []
    const rawLines = sourceText.split(/\r?\n/)
    const codeOnlyText = stripCommentsPreservingLines(sourceText)
    const codeLines = codeOnlyText.split(/\r?\n/)

    for (let i = 0; i < rawLines.length; i++) {
        const lineNumber = i + 1
        const rawLine = rawLines[i]
        const codeLine = codeLines[i] ?? ''

        for (const rule of FORBIDDEN_RULES) {
            const targetLine =
                rule.ruleId === 'BAN_NON_ASCII' ? rawLine : codeLine
            rule.regex.lastIndex = 0
            const match = rule.regex.exec(targetLine)
            if (match) {
                violations.push({
                    filePath,
                    line: lineNumber,
                    ruleId: rule.ruleId,
                    snippet: rawLine.trim(),
                    message: `${DETERMINISM_TAG} [FAIL] [${rule.ruleId}] ${filePath}:${lineNumber} :: ${rule.message}`,
                })
            }
        }
    }

    return violations
}

/**
 * Recursively collects .ts and .js files in a directory, excluding node_modules, dist, and this linter itself.
 */
export function collectTargetFiles(
    dirPath: string,
    results: string[] = [],
): string[] {
    if (!fs.existsSync(dirPath)) {
        return results
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
        if (
            entry.name === 'node_modules' ||
            entry.name === 'dist' ||
            entry.name === '.git'
        ) {
            continue
        }
        const fullPath = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
            collectTargetFiles(fullPath, results)
        } else if (
            entry.isFile() &&
            (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) &&
            entry.name !== 'lint-determinism.ts' &&
            !entry.name.endsWith('.test.ts')
        ) {
            results.push(fullPath)
        }
    }
    return results
}

/**
 * Audits an entire package directory and throws on any determinism breach.
 */
export function auditDirectoryDeterminism(
    rootDir: string,
): DeterminismViolation[] {
    const files = collectTargetFiles(rootDir)
    const allViolations: DeterminismViolation[] = []

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8')
        const fileViolations = scanSourceForDeterminismViolations(content, file)
        allViolations.push(...fileViolations)
    }

    return allViolations
}

import { fileURLToPath } from 'node:url'

const isMainModule =
    typeof process !== 'undefined' &&
    process.argv[1] === fileURLToPath(import.meta.url)

if (isMainModule) {
    const targetRoot = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '..',
    )
    const violations = auditDirectoryDeterminism(targetRoot)
    if (violations.length > 0) {
        for (const v of violations) {
            process.stderr.write(`${v.message}\n  >> ${v.snippet}\n`)
        }
        process.exit(1)
    }
    process.stdout.write(
        `${DETERMINISM_TAG} [OK] Zero volatile contamination or non-ASCII violations detected.\n`,
    )
}
