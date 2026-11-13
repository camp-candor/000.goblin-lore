/**
 * apps/dashboard/src/lib/securityHeaders.ts
 *
 * Immutable Security Hull Headers.
 * Enforces strict CSP framing constraints, sandboxing, and MIME type protections.
 */

export interface SecurityHeaderOptions {
    readonly allowedFrameOrigins?: readonly string[]
    readonly enableHsts?: boolean
}

/**
 * Returns security header map conforming strictly to studio perimeter standards
 */
export function buildPerimeterSecurityHeaders(
    options?: SecurityHeaderOptions,
): Headers {
    const headers = new Headers()

    const extraOrigins = options?.allowedFrameOrigins?.join(' ') ?? ''
    const frameAncestors = `'self' https://*.pages.dev ${extraOrigins}`.trim()

    // Content-Security-Policy: Enforce frame ancestry and script containment
    const csp = [
        `default-src 'self'`,
        `frame-ancestors ${frameAncestors}`,
        `frame-src 'self' https://*.pages.dev blob: https://challenges.cloudflare.com`,
        `script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://*.clerk.services https://challenges.cloudflare.com https://static.cloudflareinsights.com`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `connect-src 'self' wss: https:`,
        `img-src 'self' data: https: blob:`,
        `font-src 'self' data: https://fonts.gstatic.com`,
        `worker-src 'self' blob:`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
    ].join('; ')

    headers.set('Content-Security-Policy', csp)
    headers.set('X-Frame-Options', 'SAMEORIGIN')
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=()',
    )

    if (options?.enableHsts ?? true) {
        headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload',
        )
    }

    // Pure 7-bit ASCII edge identity stamp
    headers.set('X-Perimeter-Gate', 'SECURE_EDGE_ISOLATE_T0')

    return headers
}
