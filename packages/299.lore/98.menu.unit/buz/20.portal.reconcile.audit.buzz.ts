/**
 * packages/299.lore/98.menu.unit/buz/20.portal.reconcile.audit.buzz.ts
 *
 * Reciprocal spatial portal reconciliation audit buzzer. Exercises the REAL
 * 01.location.unit reconcileReciprocalLinks gauntlet inside a hermetic
 * temporary repository: one-way fixture chambers, reverse portal injection
 * with matched acoustic damping, byte-0 preamble preservation on mutated
 * files, plus fail-closed negative probes (dangling pointer, idempotent
 * re-run). Streams pure 7-bit ASCII telemetry into the cns00 Blessed
 * console pane. Never touches the live repo tree.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { reconcileReciprocalLinks } from '../../01.location.unit/buz/reciprocalLinker.buzz.js'
import { parseLocationMarkdown } from '../../01.location.unit/buz/portalSymmetry.buzz.js'
import { LocationModel } from '../../01.location.unit/location.model.js'

export const PORTAL_RECONCILE_MENU_LABEL =
    '[ 8. RECONCILE SPATIAL PORTAL LINKS ]'

export const PORTAL_RECONCILE_AUDIT_HEADER =
    '--- [299.LORE :: 01.LOCATION.UNIT :: RECIPROCAL PORTAL RECONCILIATION] ---'

export const PORTAL_RECONCILE_SCAN_LINE =
    '>> [PORTAL:SCAN] Inspecting portal connections for location node...'

export const PORTAL_RECONCILE_LINK_LINE =
    '>> [LINK] Reconciled reciprocal portal: target -> source (damping matched)'

export const PORTAL_RECONCILE_BYTE_ZERO_LINE =
    '>> [BYTE-0] Byte-0 preamble verified across mutated target files.'

export const PORTAL_RECONCILE_SYMMETRY_LINE =
    '>> [SYMMETRY] Bidirectional topological symmetry verified.'

export const PORTAL_RECONCILE_SEALED_FOOTER =
    '--- [AUDIT COMPLETE: SPATIAL GRAPH RECIPROCITY SEALED AT T0 = $0.00] ---'

const PROBE_SLUG = 'audit-portal-probe'

function writeFixture(locDir: string, file: string, lines: string[]): void {
    fs.writeFileSync(path.join(locDir, file), lines.join('\n'), 'utf8')
}

export interface PortalReconcileAudit {
    scanSealed: boolean
    linkSealed: boolean
    byteZeroSealed: boolean
    symmetrySealed: boolean
    probesTrapped: number
    probeTotal: number
    valid: boolean
    errors: string[]
}

/**
 * Runs the REAL Phase 6 portal gauntlet against the live
 * reconcileReciprocalLinks buzzer inside a hermetic temp repo root.
 * Verifies injection, damping symmetry, byte-0 preservation, atomic
 * writes, and fail-closed negative probes. Never throws; reports
 * breaches via errors. Always removes the temp repo.
 */
export async function auditPortalReconcile(): Promise<PortalReconcileAudit> {
    const errors: string[] = []
    let scanSealed = false
    let linkSealed = false
    let byteZeroSealed = false
    let symmetrySealed = false
    let probesTrapped = 0

    const tempRepo = fs.mkdtempSync(
        path.join(os.tmpdir(), 'goblin-portal-reconcile-audit-'),
    )
    try {
        const locDir = path.join(tempRepo, 'series', PROBE_SLUG, 'locations')
        fs.mkdirSync(locDir, { recursive: true })

        writeFixture(locDir, 'loc_probe_a.md', [
            '---',
            'id: "loc_probe_a"',
            'title: "Probe Chamber Alpha"',
            'type: "location"',
            'axial_coordinates: { q: 0, r: 0, s: 0 }',
            'max_adult_occupants: 2',
            'acoustic_damping_cdb: 1500',
            'lighting: "dim"',
            'portal_links:',
            '  - portal_slug: "portal_a_to_b"',
            '    target_location_id: "loc_probe_b"',
            '    damping_cdb: 2200',
            '    line_of_sight: false',
            '---',
            '',
            '## Body',
            'Chamber Alpha probe body.',
            '',
        ])
        writeFixture(locDir, 'loc_probe_b.md', [
            '---',
            'id: "loc_probe_b"',
            'title: "Probe Chamber Beta"',
            'type: "location"',
            'axial_coordinates: { q: 1, r: -1, s: 0 }',
            'max_adult_occupants: 2',
            'acoustic_damping_cdb: 1500',
            'lighting: "dark"',
            'portal_links: []',
            '---',
            '',
            '## Body',
            'Chamber Beta probe body.',
            '',
        ])

        // [PORTAL:SCAN] Real reconcile must return val: 1 with 1 mutation.
        const model = new LocationModel()
        let result: any = null
        await reconcileReciprocalLinks(model, {
            idx: 'portal-reconcile-audit',
            dat: {
                seriesSlug: PROBE_SLUG,
                locationId: 'loc_probe_a',
                repoRoot: tempRepo,
            },
            slv: (res: any) => {
                result = res
            },
        } as any)

        scanSealed =
            result?.locationBit?.val === 1 &&
            result?.locationBit?.dat?.totalLinksChecked === 1
        if (!scanSealed) {
            errors.push(
                '[PORTAL:BREACH] reconcileReciprocalLinks failed val: 1 scan.',
            )
        }

        // [LINK] Reverse portal injected into B with matched damping + LoS.
        const bPath = path.join(locDir, 'loc_probe_b.md')
        let reverseOk = false
        if (fs.existsSync(bPath)) {
            const dossier = parseLocationMarkdown(
                fs.readFileSync(bPath, 'utf8'),
            )
            const rev = (dossier.frontmatter.portal_links || []).find(
                (p: any) => p.target_location_id === 'loc_probe_a',
            )
            reverseOk =
                !!rev && rev.damping_cdb === 2200 && rev.line_of_sight === false
        }
        linkSealed =
            reverseOk && result?.locationBit?.dat?.mutatedFiles?.length === 1
        if (!linkSealed) {
            errors.push(
                '[PORTAL:BREACH] reverse portal missing or damping/LoS asymmetric.',
            )
        }

        // [BYTE-0] Mutated target must retain ---\\n at byte offset 0.
        if (fs.existsSync(bPath)) {
            const raw = fs.readFileSync(bPath)
            byteZeroSealed =
                raw[0] === 0x2d &&
                raw[1] === 0x2d &&
                raw[2] === 0x2d &&
                raw[3] === 0x0a &&
                !raw.includes(0x0d as any)
        }
        if (!byteZeroSealed) {
            errors.push(
                '[PORTAL:BREACH] byte-0 preamble violated on mutated target.',
            )
        }

        // [SYMMETRY] No stray staging files; re-run is a mutation no-op.
        const strays = fs.readdirSync(locDir).filter((e) => e.includes('.tmp_'))
        let rerun: any = null
        await reconcileReciprocalLinks(model, {
            idx: 'portal-reconcile-audit-rerun',
            dat: {
                seriesSlug: PROBE_SLUG,
                locationId: 'loc_probe_a',
                repoRoot: tempRepo,
            },
            slv: (res: any) => {
                rerun = res
            },
        } as any)
        symmetrySealed =
            strays.length === 0 &&
            rerun?.locationBit?.dat?.mutatedFiles?.length === 0
        if (!symmetrySealed) {
            errors.push(
                '[PORTAL:BREACH] stray staging files or non-idempotent re-run.',
            )
        }

        // Negative probe: dangling pointer must fail closed with val: 0.
        writeFixture(locDir, 'loc_probe_broken.md', [
            '---',
            'id: "loc_probe_broken"',
            'title: "Broken Probe Chamber"',
            'type: "location"',
            'portal_links:',
            '  - portal_slug: "portal_to_nowhere"',
            '    target_location_id: "loc_void_phantom"',
            '    damping_cdb: 1500',
            '    line_of_sight: false',
            '---',
            '',
        ])
        let dangling: any = null
        await reconcileReciprocalLinks(model, {
            idx: 'portal-reconcile-audit-dangling',
            dat: {
                seriesSlug: PROBE_SLUG,
                locationId: 'loc_probe_broken',
                repoRoot: tempRepo,
            },
            slv: (res: any) => {
                dangling = res
            },
        } as any)
        if (
            dangling?.locationBit?.val === 0 &&
            Array.isArray(dangling?.locationBit?.dat?.errors) &&
            dangling.locationBit.dat.errors.some((e: string) =>
                e.includes('DANGLING_SPATIAL_POINTER'),
            )
        ) {
            probesTrapped += 1
        } else {
            errors.push(
                '[PORTAL:BREACH] dangling probe escaped without DANGLING_SPATIAL_POINTER.',
            )
        }
    } finally {
        fs.rmSync(tempRepo, { recursive: true, force: true })
    }

    const probeTotal = 1
    return {
        scanSealed,
        linkSealed,
        byteZeroSealed,
        symmetrySealed,
        probesTrapped,
        probeTotal,
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Streams the exact 7-bit ASCII portal reconciliation telemetry block on
 * success; throws a [PORTAL:FAILED] error on any breach.
 */
export const runPortalReconcileAudit = async (): Promise<string[]> => {
    const audit = await auditPortalReconcile()
    if (!audit.valid) {
        throw new Error(`[PORTAL:FAILED] ${audit.errors.join(' ')}`)
    }

    return [
        PORTAL_RECONCILE_AUDIT_HEADER,
        PORTAL_RECONCILE_SCAN_LINE,
        PORTAL_RECONCILE_LINK_LINE,
        PORTAL_RECONCILE_BYTE_ZERO_LINE,
        PORTAL_RECONCILE_SYMMETRY_LINE,
        PORTAL_RECONCILE_SEALED_FOOTER,
    ]
}
