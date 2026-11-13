import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import { resolveRepoRoot } from '../../29.series.unit/buz/scaffoldSeriesTree.buzz.js'
import {
    resolveChronologyConfig,
    DEFAULT_CHRONOLOGY_CONFIG,
} from '../../38.types.unit/fce/chronology.interface.js'
import {
    parseCalendarStart,
    advanceGregorianClock,
} from '../../05.clock.unit/buz/clock.buzz.js'
import {
    buildChronologyWorldDossier,
    verifyByteZeroBuffer,
} from '../../27.seed.unit/buz/seedWorldDefinitions.buzz.js'

export const CHRONOLOGY_MENU_LABEL = '[T] SIMULATION CHRONOLOGY CLOCK'

export function applySeriesChronologyUpdate(
    seriesDir: string,
    patch: any,
): any {
    const configPath = path.join(seriesDir, 'series.config.json')
    const existing = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
        : {}
    const merged = { ...(existing?.chronology ?? {}), ...(patch ?? {}) }
    const resolved = resolveChronologyConfig(merged)
    parseCalendarStart(resolved)

    existing.chronology = resolved
    if (!existing.series_slug) {
        existing.series_slug = path.basename(seriesDir)
    }
    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2) + '\n', {
        encoding: 'utf8',
    })

    const slug = existing.series_slug || path.basename(seriesDir)
    const worldDir = path.join(seriesDir, 'world')
    if (!fs.existsSync(worldDir)) {
        fs.mkdirSync(worldDir, { recursive: true })
    }
    const dossier = buildChronologyWorldDossier(resolved, slug)
    const dossierPath = path.join(worldDir, 'chronology.md')
    fs.writeFileSync(dossierPath, dossier.replace(/\r/g, ''), {
        encoding: 'utf8',
    })
    verifyByteZeroBuffer(fs.readFileSync(dossierPath))

    return resolved
}

export function previewChronologyHorizon(cfg: any, ticks: number = 5): any[] {
    const resolved = resolveChronologyConfig(cfg ?? {})
    const snap = parseCalendarStart(resolved)
    const out: any[] = []
    let current = snap
    for (let i = 0; i < ticks; i++) {
        current = advanceGregorianClock(current, resolved.tick_seconds)
        out.push(current)
    }
    return out
}

function emitConsole(ste: State | undefined, line: string): void {
    const clean = String(line || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
    const lib = (globalThis as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        try {
            lib.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: clean,
            })
        } catch {}
        return
    }
    if (ste && typeof ste.hunt === 'function') {
        try {
            ste.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: clean,
            })
        } catch {}
    }
}

export const runChronologyMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const dat = (bal?.dat || {}) as Record<string, any>
    const lib = (globalThis as any).LIBRARY

    // Headless programmatic update
    if (dat.patch && dat.seriesDir) {
        try {
            const resolved = applySeriesChronologyUpdate(
                dat.seriesDir,
                dat.patch,
            )
            emitConsole(
                ste,
                `>> [CHRONO:OK] Updated ${resolved.start_date} ${resolved.start_time}`,
            )
            if (bal?.slv) {
                bal.slv({
                    mnuBit: {
                        idx: bal.idx || 'chronology-menu',
                        val: 1,
                        dat: { chronology: resolved },
                    },
                })
            }
            return cpy
        } catch (err: any) {
            emitConsole(ste, `:: [CHRONO:ERR] ${err?.message || String(err)}`)
            if (bal?.slv) {
                bal.slv({
                    mnuBit: {
                        idx: bal.idx || 'chronology-menu',
                        val: -1,
                        dat: { error: err?.message || String(err) },
                    },
                })
            }
            return cpy
        }
    }

    // Preview
    if (dat.preview) {
        const cfg = dat.chronology || DEFAULT_CHRONOLOGY_CONFIG
        const horizon = previewChronologyHorizon(cfg, dat.ticks || 5)
        emitConsole(ste, `>> [CHRONO:PREVIEW] ${horizon.length} ticks`)
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: bal.idx || 'chronology-menu',
                    val: 1,
                    dat: { horizon },
                },
            })
        }
        return cpy
    }

    // Inspect active series
    const repoRoot = dat.repoRoot || resolveRepoRoot()
    const seriesSlug =
        dat.activeSeries || cpy?.activeSeries || '000.sample-hearth'
    const seriesDir = path.join(repoRoot, 'series', seriesSlug)
    let chronology = DEFAULT_CHRONOLOGY_CONFIG
    const configPath = path.join(seriesDir, 'series.config.json')
    if (fs.existsSync(configPath)) {
        try {
            const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'))
            chronology = resolveChronologyConfig(cfg?.chronology)
        } catch {
            chronology = DEFAULT_CHRONOLOGY_CONFIG
        }
    }
    const snap = parseCalendarStart(chronology)
    emitConsole(
        ste,
        `>> [CHRONO:INSPECT] ${chronology.start_date} ${chronology.start_time} ${snap.daypart} ${chronology.tick_seconds}s`,
    )

    const choices = [
        '[1] INSPECT SERIES CHRONOLOGY',
        '[2] SET START DATE (YYYY-MM-DD)',
        '[3] SET START TIME (HH:MM:SS)',
        '[4] SET TICK CADENCE (SECONDS)',
        '[5] PREVIEW +5 TICK HORIZON',
        '[<] RETURN TO LORE MENU',
    ]

    if (lib && typeof lib.hunt === 'function') {
        try {
            const grid = await lib.hunt('[Grid action] Update Grid', {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: 8,
            })
            const net = grid?.grdBit?.dat
            await lib.hunt('[Open action] Open Choice', {
                lst: choices,
                net,
            })
        } catch {}
    }

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: bal.idx || 'chronology-menu',
                val: 1,
                lst: choices,
                dat: { chronology, snapshot: snap },
            },
        })
    }
    return cpy
}
