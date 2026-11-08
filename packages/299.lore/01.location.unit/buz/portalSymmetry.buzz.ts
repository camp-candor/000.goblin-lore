import yaml from 'yaml'
import type { Portal } from '../fce/spatial.schema.js'

export interface ParsedLocationDossier {
    frontmatter: Record<string, any>
    bodyContent: string
    byteZeroOk: boolean
}

/**
 * Parses raw markdown bytes into frontmatter and body, asserting Byte-0 frontmatter law.
 */
export function parseLocationMarkdown(
    rawContent: string,
): ParsedLocationDossier {
    const byteZeroOk = rawContent.startsWith('---\n')
    if (!byteZeroOk && !rawContent.startsWith('---\r\n')) {
        throw new Error(
            '[BYTE_ZERO_BREACH] Location dossier does not begin with frontmatter delimiter at offset 0',
        )
    }

    const parts = rawContent.split(/^---$/m)
    if (parts.length < 3) {
        throw new Error(
            '[CORRUPTED_DOSSIER] Location dossier lacks closing frontmatter delimiter',
        )
    }

    const rawYaml = parts[1]
    const bodyContent = parts.slice(2).join('---')
    const frontmatter = yaml.parse(rawYaml) || {}

    return {
        frontmatter,
        bodyContent,
        byteZeroOk: true,
    }
}

/**
 * Injects a reverse portal entry into frontmatter if not already present.
 * Ensures bidirectional acoustic damping and line-of-sight symmetry.
 */
export function injectReversePortal(
    frontmatter: Record<string, any>,
    sourceLocationId: string,
    incomingPortal: {
        portalSlug?: string
        dampingCdB?: number
        lineOfSight?: boolean
    },
): { modified: boolean; injectedPortal: Portal } {
    frontmatter.portal_links = Array.isArray(frontmatter.portal_links)
        ? frontmatter.portal_links
        : []

    const targetId = frontmatter.id
    const reverseSlug = incomingPortal.portalSlug
        ? `portal_${targetId}_to_${sourceLocationId}`
        : `portal_${targetId}_to_${sourceLocationId}`

    const existing = frontmatter.portal_links.find(
        (p: any) => p.target_location_id === sourceLocationId,
    )

    if (existing) {
        let changed = false
        // Enforce symmetric acoustic damping match
        if (
            incomingPortal.dampingCdB !== undefined &&
            existing.damping_cdb !== incomingPortal.dampingCdB
        ) {
            existing.damping_cdb = incomingPortal.dampingCdB
            changed = true
        }
        if (
            incomingPortal.lineOfSight !== undefined &&
            existing.line_of_sight !== incomingPortal.lineOfSight
        ) {
            existing.line_of_sight = incomingPortal.lineOfSight
            changed = true
        }
        return { modified: changed, injectedPortal: existing }
    }

    const newPortal: Portal = {
        portal_slug: reverseSlug,
        target_location_id: sourceLocationId,
        damping_cdb:
            incomingPortal.dampingCdB !== undefined
                ? incomingPortal.dampingCdB
                : 1500,
        line_of_sight:
            incomingPortal.lineOfSight !== undefined
                ? incomingPortal.lineOfSight
                : false,
    }

    frontmatter.portal_links.push(newPortal)
    return { modified: true, injectedPortal: newPortal }
}

/**
 * Re-serializes frontmatter and prose while strictly preserving Byte-0 alignment.
 */
export function serializeLocationMarkdown(
    frontmatter: Record<string, any>,
    bodyContent: string,
): string {
    const serializedYaml = yaml.stringify(frontmatter).trim()
    return `---\n${serializedYaml}\n---${bodyContent}`
}
