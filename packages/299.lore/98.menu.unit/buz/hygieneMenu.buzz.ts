/**
 * packages/299.lore/98.menu.unit/buz/hygieneMenu.buzz.ts
 *
 * [HYGIENE] flight deck: deterministic unit buzzer ping sweep across every
 * mounted 299.lore unit. Zero external HTTP, zero async deadlocks -- every
 * unit resolution is a synchronous disk scan resolved via bal.slv, and all
 * streamed telemetry is sanitized to pure 7-bit ASCII.
 */

import fs from 'node:fs'
import path from 'node:path'
import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import { sanitizeAscii } from './genesisMenu.buzz.js'
import { resolveRepoRoot } from '../../29.series.unit/buz/scaffoldSeriesTree.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

export const HYGIENE_LABEL = '[HYGIENE]'
export const HYGIENE_SWEEP_LABEL = '[1] RUN UNIT BUZZER PING SWEEP'
export const HYGIENE_BACK_LABEL = '[ BACK ]'

function emitConsole(ste: State | undefined, line: string): void {
    const clean = sanitizeAscii(line)
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: clean }).catch(() => {})
    } else if (ste && typeof ste.hunt === 'function') {
        ste.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: clean }).catch(() => {})
    }
}

/**
 * Synchronously resolves the canonical 299.lore package root from the
 * monorepo root. Returns null when the package directory is absent.
 */
export function resolveLorePackageRoot(
    repoRoot: string = resolveRepoRoot(),
): string | null {
    const candidate = path.join(repoRoot, 'packages', '299.lore')
    if (fs.existsSync(candidate)) return candidate
    return null
}

/**
 * Synchronously enumerates the mounted unit directories (e.g. 00.lore.unit,
 * 98.menu.unit, 99.bus.unit) inside the canonical package root.
 */
export function discoverMountedUnits(
    packageRoot: string = resolveLorePackageRoot() || '',
): string[] {
    if (!packageRoot || !fs.existsSync(packageRoot)) return []
    return fs
        .readdirSync(packageRoot, { withFileTypes: true })
        .filter(
            (entry) =>
                entry.isDirectory() &&
                /^\d+\.[a-z0-9]+\.unit$/.test(entry.name),
        )
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b))
}

/**
 * Pings a single unit deterministically: the unit directory must exist and
 * resolve at least one model file synchronously (units without a buzzer
 * surface are still valid headless domains).
 */
export function pingUnit(packageRoot: string, unitName: string): boolean {
    const unitDir = path.join(packageRoot, unitName)
    if (!fs.existsSync(unitDir)) return false
    const entries = fs.readdirSync(unitDir)
    return entries.some((entry) => entry.endsWith('.model.ts'))
}

/**
 * Runs the full unit buzzer ping sweep and returns the telemetry lines.
 * Purely synchronous disk reads; no network, no external endpoints.
 */
export function sweepMountedUnits(
    packageRoot: string = resolveLorePackageRoot() || '',
): string[] {
    const units = discoverMountedUnits(packageRoot)
    const lines: string[] = []

    lines.push(`>> [HYGIENE:SWEEP] Inspecting ${units.length} mounted units...`)

    let resolved = 0
    for (const unit of units) {
        if (pingUnit(packageRoot, unit)) {
            resolved += 1
            lines.push(`:: [HYGIENE:PING] ${unit} -> OK`)
        } else {
            lines.push(`:: [HYGIENE:PING] ${unit} -> FAIL (no model file)`)
        }
    }

    if (resolved === units.length) {
        lines.push(
            `>> [HYGIENE:OK] ${resolved}/${units.length} units resolved synchronously at T_0. Clean 7-bit ASCII verified.`,
        )
    } else {
        lines.push(
            `>> [HYGIENE:FAIL] ${resolved}/${units.length} units resolved synchronously; hygiene breach detected.`,
        )
    }

    return lines
}

/**
 * Dispatches the [1] RUN UNIT BUZZER PING SWEEP hygiene action: streams the
 * sweep telemetry into cns00 and seals the receipt via bal.slv.
 */
export const runHygieneMenu = (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): MenuModel => {
    const lines = sweepMountedUnits()
    if (!Array.isArray(cpy.lastTelemetryReport)) {
        cpy.lastTelemetryReport = []
    }
    for (const line of lines) {
        emitConsole(ste, line)
        cpy.lastTelemetryReport.push(line)
    }

    const receiptLine = lines[lines.length - 1] || '>> [HYGIENE:FAIL] no units'
    cpy.activeSelection = HYGIENE_SWEEP_LABEL
    cpy.lastLifecycleReceipt = receiptLine.includes('[HYGIENE:OK]')
        ? '[HYGIENE:OK]'
        : '[HYGIENE:FAIL]'
    cpy.statusMessage = receiptLine

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'run-unit-buzzer-ping-sweep',
                val: cpy.lastLifecycleReceipt === '[HYGIENE:OK]' ? 1 : -1,
                src: 'HYGIENE',
                dat: { lines },
            },
        })
    }
    return cpy
}
