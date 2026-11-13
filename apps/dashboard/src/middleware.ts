/**
 * apps/dashboard/src/middleware.ts
 *
 * Astro Edge Middleware for Cloudflare Pages / Workers.
 * Executes Sub-5ms Cryptographic Handshake, Path Traversal Defense,
 * Tenant Scoping, and Ingress Security Perimeter.
 * Pure 7-bit clean ASCII compliance strictly enforced.
 */

import { defineMiddleware } from 'astro:middleware'
import { authenticateEdgeRequest } from './lib/clerkEdge'
import { buildPerimeterSecurityHeaders } from './lib/securityHeaders'
import {
    assertNoPathTraversal,
    sanitizeAsciiTelemetry,
} from './lib/security/sandboxGuard'

export const onRequest = defineMiddleware(async (context, next) => {
    const { request, url, locals } = context
    const pathname = url.pathname

    // Static assets pass through without auth overhead
    if (
        pathname.startsWith('/_astro') ||
        pathname.startsWith('/favicon.') ||
        pathname.startsWith('/assets/')
    ) {
        const response = await next()
        return response
    }

    const startTime = performance.now()

    // 1. Path Traversal Perimeter Defense
    try {
        assertNoPathTraversal(url.pathname)
    } catch {
        return new Response(
            JSON.stringify({
                error: 'FORBIDDEN_PATH_TRAVERSAL_DETECTED',
                code: 'TRAVERSAL_DETECTED',
                message: 'Inbound request violates edge path perimeter guard.',
                statusCode: 400,
                timestamp: new Date().toISOString(),
            }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Perimeter-Guard': 'REJECTED',
                    'X-Perimeter-Reason': 'PATH_TRAVERSAL_DEFENSE',
                    'X-Compute-Tier': 'T0_ZERO_SPEND',
                    ...Object.fromEntries(
                        buildPerimeterSecurityHeaders().entries(),
                    ),
                },
            },
        )
    }

    // 2. Resolve Active Lore Scope
    // Lore rig binding takes precedence; legacy series slug is the fallback
    const activeSeriesSlug =
        (import.meta.env.PUBLIC_LORE_RIG as string) ||
        (import.meta.env.PUBLIC_SERIES_SLUG as string) ||
        '[UNBOUND]'
    const isUnboundSeries =
        activeSeriesSlug === '[UNBOUND]' ||
        activeSeriesSlug === '[NONE]' ||
        !activeSeriesSlug

    // 3. Unbound Lore Scope Redirect Interceptor
    // Intercept all direct navigations to protected lore and telemetry suites
    const isUnboundProtectedPath =
        url.pathname.startsWith('/scenes/') ||
        url.pathname.startsWith('/episodes/') ||
        url.pathname.startsWith('/lore/') ||
        url.pathname.startsWith('/director/') ||
        url.pathname.startsWith('/telemetry/') ||
        url.pathname.startsWith('/review/') ||
        url.pathname.startsWith('/finance/')

    if (isUnboundSeries && isUnboundProtectedPath) {
        return context.redirect('/', 307)
    }

    // Access Cloudflare environment bindings safely from Astro locals / runtime
    let runtimeEnv: Record<string, string> = {}
    try {
        // @ts-ignore
        const cfWorkers = await import('cloudflare:workers')
        if (cfWorkers?.env) {
            runtimeEnv = cfWorkers.env as unknown as Record<string, string>
        }
    } catch {
        // Fallback for non-worker environments
    }

    const cfContextEnv = (
        locals as unknown as { cfContext?: { env?: Record<string, string> } }
    )?.cfContext?.env
    if (cfContextEnv) {
        runtimeEnv = { ...cfContextEnv, ...runtimeEnv }
    }

    const auth = await authenticateEdgeRequest(request, {
        CLERK_JWKS_URL:
            runtimeEnv.PUBLIC_CLERK_JWKS_URL ||
            import.meta.env.PUBLIC_CLERK_JWKS_URL,
        CF_ACCESS_CLIENT_ID: runtimeEnv.CF_ACCESS_CLIENT_ID,
        CF_ACCESS_CLIENT_SECRET: runtimeEnv.CF_ACCESS_CLIENT_SECRET,
    })

    const elapsedMs = (performance.now() - startTime).toFixed(2)
    const logMessage = `>> [PERIMETER][INGRESS] Path: ${pathname} | Auth: ${auth.authenticated} | ${elapsedMs}ms`
    console.log(sanitizeAsciiTelemetry(logMessage))

    // Protect Directorial Control Decks (/director/*) and Injection APIs (/api/director/*)
    const isProtectedPath =
        pathname.startsWith('/director') || pathname.startsWith('/api/director')

    if (isProtectedPath) {
        if (!auth.authenticated) {
            console.warn(
                `>> [AUTH][REJECT] Unauthorized access to ${pathname} :: ${auth.failureReason}`,
            )

            // API routes return fail-closed JSON 401
            if (pathname.startsWith('/api/')) {
                return new Response(
                    JSON.stringify({
                        error: 'UNAUTHORIZED_EDGE_GATE',
                        statusCode: 401,
                        reason: auth.failureReason,
                        timestamp: new Date().toISOString(),
                    }),
                    {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            ...Object.fromEntries(
                                buildPerimeterSecurityHeaders().entries(),
                            ),
                        },
                    },
                )
            }

            // Web routes redirect to unauthenticated login or home
            return context.redirect(
                `/?auth_error=${encodeURIComponent(auth.failureReason || 'UNAUTHORIZED')}`,
            )
        }

        // Role check: Only showrunner_admin or machine_broker may access directorial decks
        if (
            auth.role !== 'showrunner_admin' &&
            auth.role !== 'machine_broker'
        ) {
            console.warn(
                `>> [AUTH][FORBIDDEN] Insufficient privilege for ${pathname} (Role: ${auth.role})`,
            )
            return new Response(
                JSON.stringify({
                    error: 'FORBIDDEN_INSUFFICIENT_PRIVILEGES',
                    statusCode: 403,
                    role: auth.role,
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        ...Object.fromEntries(
                            buildPerimeterSecurityHeaders().entries(),
                        ),
                    },
                },
            )
        }
    }

    // Attach verified context to Astro locals and preserve Clerk AuthFn
    const existingAuth = (locals as unknown as { auth?: () => any })?.auth
    const authHandler = Object.assign(() => {
        if (typeof existingAuth === 'function') {
            try {
                const clerkAuth = existingAuth()
                if (clerkAuth && (clerkAuth.userId || clerkAuth.sessionId)) {
                    return clerkAuth
                }
            } catch {
                // Fallback to edge auth
            }
        }
        return {
            ...auth,
            userId:
                auth.authenticated && auth.userId !== 'anonymous'
                    ? auth.userId
                    : null,
            sessionId: null,
        }
    }, auth)

    ;(
        locals as unknown as {
            auth?: typeof authHandler
            edgeAuth?: typeof auth
        }
    ).auth = authHandler
    ;(locals as unknown as { edgeAuth?: typeof auth }).edgeAuth = auth

    // Execute downstream route
    const response = await next()

    // Inject Perimeter Security Headers into the final HTTP response
    const secHeaders = buildPerimeterSecurityHeaders({
        allowedFrameOrigins: [
            'https://aistudio.google.com',
            'https://*.google.com',
            'https://*.googleusercontent.com',
            'https://*.usercontent.goog',
            'https://*.run.app',
        ],
    })
    secHeaders.forEach((val, key) => {
        response.headers.set(key, val)
    })
    response.headers.delete('X-Frame-Options')

    const latencyMs = Math.round(performance.now() - startTime)
    response.headers.set('X-Edge-Auth-Latency-Ms', latencyMs.toString())
    response.headers.set('X-Perimeter-Gate', 'SECURE_EDGE_ISOLATE_T0')
    response.headers.set('X-Compute-Tier', 'T0_ZERO_SPEND')

    return response
})
