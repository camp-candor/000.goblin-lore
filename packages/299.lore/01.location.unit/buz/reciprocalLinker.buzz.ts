import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import type State from '../../99.core/state.js'
import type { LocationModel } from '../location.model.js'
import type LocationBit from '../fce/location.bit.js'
import type {
    ReconcileSpatialLinksPayload,
    ReconcileSpatialLinksReceipt,
    PortalLinkMutation,
} from '../fce/location.bit.js'
import {
    parseLocationMarkdown,
    injectReversePortal,
    serializeLocationMarkdown,
} from './portalSymmetry.buzz.js'

export function resolveRepoRoot(startDir: string = process.cwd()): string {
    let curr = path.resolve(startDir)
    for (let i = 0; i < 6; i++) {
        if (
            fs.existsSync(path.join(curr, 'AGENTS.md')) ||
            (fs.existsSync(path.join(curr, 'series')) &&
                fs.existsSync(path.join(curr, 'packages')))
        ) {
            return curr
        }
        const parent = path.dirname(curr)
        if (parent === curr) break
        curr = parent
    }
    curr = path.resolve(startDir)
    for (let i = 0; i < 6; i++) {
        if (
            fs.existsSync(path.join(curr, 'series')) ||
            fs.existsSync(path.join(curr, 'packages'))
        ) {
            return curr
        }
        const parent = path.dirname(curr)
        if (parent === curr) break
        curr = parent
    }
    return path.resolve(startDir)
}

function emitConsole(ste: State | undefined, line: string): void {
    // eslint-disable-next-line no-control-regex
    const clean = line.replace(/[^\x00-\x7F]/g, '')
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        lib.hunt('[Console action] Update Console', {
            idx: 'cns00',
            src: clean,
        }).catch(() => {})
    } else if (ste && typeof ste.hunt === 'function') {
        try {
            ste.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: clean,
            }).catch(() => {})
        } catch {}
    }
}

/**
 * Scans a location dossier, checks all portal targets, and executes atomic reciprocal link injection.
 */
export const reconcileReciprocalLinks = async (
    cpy: LocationModel,
    bal: LocationBit,
    ste?: State,
): Promise<LocationModel> => {
    const payload: ReconcileSpatialLinksPayload = bal.dat || {}
    const seriesSlug = bal.src || payload.seriesSlug
    const locationId = payload.locationId

    if (!seriesSlug || !locationId) {
        const errorMsg = 'MISSING_SERIES_SLUG_OR_LOCATION_ID'
        emitConsole(ste, `>> [FAIL] reconcileReciprocalLinks: ${errorMsg}`)
        if (bal.slv) {
            bal.slv({
                locationBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: errorMsg },
                },
            })
        }
        return cpy
    }

    const repoRoot = payload.repoRoot || resolveRepoRoot()
    const locationsDir = path.join(repoRoot, 'series', seriesSlug, 'locations')

    if (!fs.existsSync(locationsDir)) {
        const errorMsg = `LOCATIONS_DIR_NOT_FOUND: ${locationsDir}`
        emitConsole(ste, `>> [FAIL] reconcileReciprocalLinks: ${errorMsg}`)
        if (bal.slv) {
            bal.slv({
                locationBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: errorMsg },
                },
            })
        }
        return cpy
    }

    const sourceFile = path.join(locationsDir, `${locationId}.md`)
    if (!fs.existsSync(sourceFile)) {
        const errorMsg = `SOURCE_LOCATION_NOT_FOUND: ${sourceFile}`
        emitConsole(ste, `>> [FAIL] reconcileReciprocalLinks: ${errorMsg}`)
        if (bal.slv) {
            bal.slv({
                locationBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: errorMsg },
                },
            })
        }
        return cpy
    }

    try {
        const sourceRaw = fs.readFileSync(sourceFile, 'utf8')
        const sourceDossier = parseLocationMarkdown(sourceRaw)
        const portalLinks: any[] = Array.isArray(
            sourceDossier.frontmatter.portal_links,
        )
            ? sourceDossier.frontmatter.portal_links
            : []

        const mutatedFiles: string[] = []
        const injectedPortals: PortalLinkMutation[] = []
        const errors: string[] = []

        for (const portal of portalLinks) {
            const targetId = portal.target_location_id
            if (!targetId) {
                errors.push(
                    `[MALFORMED_PORTAL] Portal missing target_location_id in ${locationId}`,
                )
                continue
            }

            if (targetId === locationId) {
                errors.push(
                    `[SELF_ADJACENCY_VIOLATION] Location '${locationId}' cannot link to itself`,
                )
                continue
            }

            const targetFile = path.join(locationsDir, `${targetId}.md`)
            if (!fs.existsSync(targetFile)) {
                errors.push(
                    `[DANGLING_SPATIAL_POINTER] Location '${locationId}' links to non-existent target '${targetId}'`,
                )
                continue
            }

            const targetRaw = fs.readFileSync(targetFile, 'utf8')
            const targetDossier = parseLocationMarkdown(targetRaw)

            const injection = injectReversePortal(
                targetDossier.frontmatter,
                locationId,
                {
                    portalSlug: portal.portal_slug,
                    dampingCdB: portal.damping_cdb,
                    lineOfSight: portal.line_of_sight,
                },
            )

            if (injection.modified && !payload.dryRun) {
                const updatedMarkdown = serializeLocationMarkdown(
                    targetDossier.frontmatter,
                    targetDossier.bodyContent,
                )

                // Atomic POSIX File Write Protocol via .tmp_[UUID]
                const tmpPath = path.join(
                    locationsDir,
                    `.tmp_${crypto.randomUUID()}_${targetId}.md.tmp`,
                )
                fs.writeFileSync(tmpPath, updatedMarkdown, 'utf8')
                fs.renameSync(tmpPath, targetFile)

                mutatedFiles.push(targetFile)
                injectedPortals.push({
                    sourceLocationId: targetId,
                    targetLocationId: locationId,
                    portalSlug: injection.injectedPortal.portal_slug,
                    dampingCdB: injection.injectedPortal.damping_cdb,
                    lineOfSight: injection.injectedPortal.line_of_sight,
                })

                emitConsole(
                    ste,
                    `>> [LINK] Reconciled reciprocal portal: ${targetId} -> ${locationId} (${injection.injectedPortal.damping_cdb} cdB)`,
                )
            }
        }

        const receipt: ReconcileSpatialLinksReceipt = {
            seriesSlug,
            mutatedFiles,
            injectedPortals,
            totalLinksChecked: portalLinks.length,
            symmetrical: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        }

        const success = errors.length === 0
        emitConsole(
            ste,
            success
                ? `>> [OK] Spatial portal reciprocity verified for '${locationId}'. Mutated: ${mutatedFiles.length}`
                : `:: [FAIL] Spatial portal reconciliation encountered ${errors.length} defect(s)`,
        )

        if (bal.slv) {
            bal.slv({
                locationBit: {
                    idx: bal.idx,
                    val: success ? 1 : 0,
                    dat: receipt,
                },
            })
        }
    } catch (err: any) {
        const errorMsg = err?.message || String(err)
        emitConsole(ste, `>> [FAIL] reconcileReciprocalLinks: ${errorMsg}`)
        if (bal.slv) {
            bal.slv({
                locationBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: errorMsg },
                },
            })
        }
    }

    return cpy
}
