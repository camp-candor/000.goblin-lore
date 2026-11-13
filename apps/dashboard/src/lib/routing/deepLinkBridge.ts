/**
 * apps/dashboard/src/lib/routing/deepLinkBridge.ts
 *
 * Bidirectional Deep-Link Translation & History Mirroring Engine.
 * Resolves container URLs from incoming Astro routes and serializes
 * child SPA navigation events into top-level window.history updates.
 * Pure 7-bit clean ASCII compliance strictly enforced.
 */

export interface DeepLinkParams {
    readonly entityId?: string
    readonly sceneId?: string
    readonly draftId?: string
    readonly focus?: string
    readonly revision?: string
    readonly customParams?: Readonly<Record<string, string>>
}

export interface RouteChangedEnvelope {
    readonly type: 'ROUTE_CHANGED'
    readonly payload: {
        readonly path: string
        readonly query?: Record<string, string>
        readonly params?: DeepLinkParams
    }
}

/**
 * Normalizes base URLs by stripping trailing slashes
 */
export function normalizeBaseUrl(url: string): string {
    return url.replace(/\/+$/, '')
}

/**
 * Sanitizes an incoming path string to guard against open redirects,
 * protocol-relative URLs, and path traversal sequences.
 */
export function sanitizeInternalPath(rawPath: string): string | null {
    if (typeof rawPath !== 'string') {
        return null
    }

    const trimmed = rawPath.trim()
    if (trimmed.length === 0) {
        return null
    }

    // Reject non-ASCII characters
    if (!/^[\x00-\x7F]*$/.test(trimmed)) {
        return null
    }

    // Reject external URI schemes and protocol-relative URLs
    if (
        trimmed.startsWith('//') ||
        trimmed.startsWith('javascript:') ||
        trimmed.startsWith('data:')
    ) {
        return null
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        if (
            !trimmed.includes('preview-app.pages.dev') &&
            !trimmed.includes('host.internal')
        ) {
            return null
        }
    } else {
        // Path must be absolute relative to origin root
        if (!trimmed.startsWith('/')) {
            return null
        }
    }

    // Reject directory traversal attempts
    if (trimmed.includes('../') || trimmed.includes('/..')) {
        return null
    }

    return trimmed
}

/**
 * Synthesizes a deterministic child container iframe URL by mapping
 * Astro top-level route parameters and search flags into query parameters.
 */
export function synthesizeContainerUrl(
    baseSpaUrl: string,
    params?: DeepLinkParams,
): string {
    const cleanBase = normalizeBaseUrl(baseSpaUrl)
    let sanitizedBase = sanitizeInternalPath(cleanBase) || '/'
    if (cleanBase.startsWith('http://') || cleanBase.startsWith('https://')) {
        sanitizedBase = cleanBase
    }

    const target = new URL(
        sanitizedBase.startsWith('http')
            ? sanitizedBase
            : `https://host.internal${sanitizedBase}`,
    )

    if (params?.entityId) {
        target.searchParams.set('entity', params.entityId)
    }
    if (params?.sceneId) {
        target.searchParams.set('sceneId', params.sceneId)
    }
    if (params?.draftId) {
        target.searchParams.set('draft', params.draftId)
    }
    if (params?.focus) {
        target.searchParams.set('focus', params.focus)
    }
    if (params?.revision) {
        target.searchParams.set('revision', params.revision)
    }

    if (params?.customParams) {
        for (const [key, val] of Object.entries(params.customParams)) {
            if (!target.searchParams.has(key)) {
                target.searchParams.set(key, val)
            }
        }
    }

    // Deterministically sort keys for RFC canonical reproducibility
    target.searchParams.sort()

    if (sanitizedBase.startsWith('http')) {
        return target.toString()
    }
    return `${target.pathname}${target.search === '?' ? '' : target.search}`
}

/**
 * Validates and decodes incoming ROUTE_CHANGED postMessage envelopes from the iframe.
 */
export function validateRouteChangedEnvelope(
    eventData: unknown,
): RouteChangedEnvelope | null {
    if (!eventData || typeof eventData !== 'object') {
        return null
    }

    const candidate = eventData as Partial<RouteChangedEnvelope>
    if (candidate.type !== 'ROUTE_CHANGED') {
        return null
    }

    if (!candidate.payload || typeof candidate.payload.path !== 'string') {
        return null
    }

    // Ensure path is relative and starts with a leading slash to prevent open redirects
    const cleanPath = candidate.payload.path.trim()
    const sanitizedPath = sanitizeInternalPath(cleanPath)
    if (!sanitizedPath) {
        return null
    }
    if (sanitizedPath.startsWith('http')) {
        return null // Not allowed for route changed envelope
    }
    if (!sanitizedPath.startsWith('/')) {
        return null
    }

    let sanitizedParams: DeepLinkParams | undefined = undefined
    if (
        typeof candidate.payload.params === 'object' &&
        candidate.payload.params !== null
    ) {
        const rawParams = candidate.payload.params as Record<string, unknown>
        sanitizedParams = {
            sceneId:
                typeof rawParams.sceneId === 'string'
                    ? rawParams.sceneId
                    : undefined,
            entityId:
                typeof rawParams.entityId === 'string'
                    ? rawParams.entityId
                    : undefined,
            draftId:
                typeof rawParams.draftId === 'string'
                    ? rawParams.draftId
                    : undefined,
            focus:
                typeof rawParams.focus === 'string'
                    ? rawParams.focus
                    : undefined,
            revision:
                typeof rawParams.revision === 'string'
                    ? rawParams.revision
                    : undefined,
        }
    }

    return {
        type: 'ROUTE_CHANGED',
        payload: {
            path: sanitizedPath,
            query: candidate.payload.query,
            params: sanitizedParams,
        },
    }
}

/**
 * Builds the top-level browser display URL when the embedded SPA navigates.
 */
export function formatHostDisplayUrl(
    path: string,
    query?: Record<string, string>,
): string {
    const sanitizedPath = sanitizeInternalPath(path) || path
    const url = new URL(sanitizedPath, 'https://host.internal')
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            url.searchParams.set(k, v)
        }
    }
    return `${url.pathname}${url.search}`
}

/**
 * Updates the top-level browser history without triggering a document reload.
 */
export function mirrorRouteToHostHistory(
    path: string,
    query?: Record<string, string>,
): boolean {
    if (typeof window === 'undefined' || !window.history) {
        return false
    }

    const sanitizedPath = sanitizeInternalPath(path)
    if (!sanitizedPath) {
        return false
    }

    const nextUrl = formatHostDisplayUrl(sanitizedPath, query)
    const currentUrl = `${window.location.pathname}${window.location.search}`

    if (currentUrl !== nextUrl) {
        console.log(
            `>> [ROUTER][MIRROR] Updating host history: ${currentUrl} -> ${nextUrl}`,
        )
        try {
            window.history.replaceState(null, '', nextUrl)
            return true
        } catch {
            return false
        }
    }
    return false
}
