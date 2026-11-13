/**
 * apps/dashboard/src/lib/clerkEdge.ts
 *
 * Edge Ingress Cryptographic Token Verifier.
 * Strictly enforces RS256 JWKS validation via WebCrypto and Cloudflare Access Service Tokens.
 * Pure 7-bit ASCII telemetry. Zero third-party crypto dependencies.
 */

export interface VerifiedAuthContext {
    readonly authenticated: boolean
    readonly userId: string
    readonly role: 'showrunner_admin' | 'spectator' | 'machine_broker'
    readonly seriesScope: string
    readonly keyId?: string
    readonly failureReason?: string
}

interface JwkKey {
    readonly kty: string
    readonly kid: string
    readonly use: string
    readonly alg: string
    readonly n: string
    readonly e: string
}

interface JwksPayload {
    readonly keys: readonly JwkKey[]
}

// In-memory JWKS cache across edge isolate invocations
let jwksCache: {
    readonly keys: ReadonlyMap<string, CryptoKey>
    readonly expiresAt: number
} | null = null

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour cold cache

/**
 * Base64URL decode string into Uint8Array
 */
function base64UrlDecode(str: string): Uint8Array {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    const padLen = (4 - (base64.length % 4)) % 4
    const padded = base64.padEnd(base64.length + padLen, '=')
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

/**
 * Parses JWT without verification to extract header kid
 */
function parseJwtUnverified(jwt: string): {
    readonly header: { readonly alg: string; readonly kid?: string }
    readonly payload: Record<string, unknown>
    readonly signingInput: string
    readonly signatureBytes: Uint8Array
} {
    const parts = jwt.split('.')
    if (parts.length !== 3) {
        throw new Error('MALFORMED_JWT_PARTS')
    }

    const [headerB64, payloadB64, sigB64] = parts
    const header = JSON.parse(
        new TextDecoder().decode(base64UrlDecode(headerB64)),
    )
    const payload = JSON.parse(
        new TextDecoder().decode(base64UrlDecode(payloadB64)),
    )
    const signingInput = `${headerB64}.${payloadB64}`
    const signatureBytes = base64UrlDecode(sigB64)

    return { header, payload, signingInput, signatureBytes }
}

/**
 * Converts RSA JWK (n, e) to CryptoKey using WebCrypto
 */
async function importRsaJwk(jwk: JwkKey): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
        'jwk',
        {
            kty: jwk.kty,
            n: jwk.n,
            e: jwk.e,
            alg: jwk.alg,
            ext: true,
        },
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: { name: 'SHA-256' },
        },
        false,
        ['verify'],
    )
}

/**
 * Fetches and caches JWKS keys from Clerk endpoint
 */
async function getCachedSigningKey(
    jwksUrl: string,
    kid?: string,
): Promise<CryptoKey | null> {
    const now = Date.now()
    if (!jwksCache || now > jwksCache.expiresAt) {
        const res = await fetch(jwksUrl, {
            method: 'GET',
            headers: { Accept: 'application/json' },
        })

        if (!res.ok) {
            console.error(
                `>> [AUTH][FAIL] JWKS retrieval failed HTTP ${res.status}`,
            )
            return null
        }

        const data = (await res.json()) as JwksPayload
        const keyMap = new Map<string, CryptoKey>()

        for (const key of data.keys) {
            if (key.alg === 'RS256' && key.use === 'sig') {
                const cryptoKey = await importRsaJwk(key)
                keyMap.set(key.kid, cryptoKey)
            }
        }

        jwksCache = {
            keys: keyMap,
            expiresAt: now + CACHE_TTL_MS,
        }
        console.log(
            `>> [AUTH][OK] Cached ${keyMap.size} JWKS public keys at Edge`,
        )
    }

    if (kid && jwksCache.keys.has(kid)) {
        return jwksCache.keys.get(kid)!
    }

    // Fallback to first available key if single key in JWKS
    if (!kid && jwksCache.keys.size > 0) {
        return jwksCache.keys.values().next().value ?? null
    }

    return null
}

/**
 * Authenticates incoming request against Clerk RS256 JWT or Cloudflare Access Service Tokens
 */
export async function authenticateEdgeRequest(
    request: Request,
    env: {
        readonly CLERK_JWKS_URL?: string
        readonly CF_ACCESS_CLIENT_ID?: string
        readonly CF_ACCESS_CLIENT_SECRET?: string
    },
): Promise<VerifiedAuthContext> {
    // 1. Machine-to-Machine Check: Cloudflare Access Service Token
    const cfClientId = request.headers.get('CF-Access-Client-Id')
    const cfClientSecret = request.headers.get('CF-Access-Client-Secret')

    if (
        cfClientId &&
        cfClientSecret &&
        env.CF_ACCESS_CLIENT_ID &&
        env.CF_ACCESS_CLIENT_SECRET
    ) {
        if (
            cfClientId === env.CF_ACCESS_CLIENT_ID &&
            cfClientSecret === env.CF_ACCESS_CLIENT_SECRET
        ) {
            return {
                authenticated: true,
                userId: `service:${cfClientId}`,
                role: 'machine_broker',
                seriesScope: request.headers.get('X-Series-Scope') || 'default',
            }
        }
        return {
            authenticated: false,
            userId: 'anonymous',
            role: 'spectator',
            seriesScope: '[UNBOUND]',
            failureReason: 'INVALID_SERVICE_TOKEN',
        }
    }

    // 2. Interactive User Check: Clerk Bearer JWT
    const authHeader = request.headers.get('Authorization') || ''
    let token = ''

    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim()
    } else {
        // Check URL query fallback for iframe boot vector (?token=...)
        const url = new URL(request.url)
        const queryToken = url.searchParams.get('token')
        if (queryToken) {
            token = queryToken
        } else {
            // Check Cookie header for __session (Clerk session JWT)
            const cookieHeader = request.headers.get('Cookie') || ''
            const match = /(?:^|;\s*)__session=([^;]+)/.exec(cookieHeader)
            if (match) {
                token = decodeURIComponent(match[1])
            }
        }
    }

    if (!token) {
        return {
            authenticated: false,
            userId: 'anonymous',
            role: 'spectator',
            seriesScope: '[UNBOUND]',
            failureReason: 'MISSING_AUTHORIZATION_TOKEN',
        }
    }

    const jwksUrl = env.CLERK_JWKS_URL
    if (!jwksUrl) {
        console.error('>> [AUTH][FAIL] Missing CLERK_JWKS_URL binding')
        return {
            authenticated: false,
            userId: 'anonymous',
            role: 'spectator',
            seriesScope: '[UNBOUND]',
            failureReason: 'CONFIG_ERROR_MISSING_JWKS',
        }
    }

    try {
        const { header, payload, signingInput, signatureBytes } =
            parseJwtUnverified(token)

        if (header.alg !== 'RS256') {
            return {
                authenticated: false,
                userId: 'anonymous',
                role: 'spectator',
                seriesScope: '[UNBOUND]',
                failureReason: `UNSUPPORTED_ALGORITHM_${header.alg}`,
            }
        }

        const signingKey = await getCachedSigningKey(jwksUrl, header.kid)
        if (!signingKey) {
            return {
                authenticated: false,
                userId: 'anonymous',
                role: 'spectator',
                seriesScope: '[UNBOUND]',
                failureReason: 'SIGNING_KEY_NOT_FOUND',
            }
        }

        const isValid = await crypto.subtle.verify(
            'RSASSA-PKCS1-v1_5',
            signingKey,
            signatureBytes as BufferSource,
            new TextEncoder().encode(signingInput),
        )

        if (!isValid) {
            return {
                authenticated: false,
                userId: 'anonymous',
                role: 'spectator',
                seriesScope: '[UNBOUND]',
                failureReason: 'INVALID_CRYPTOGRAPHIC_SIGNATURE',
            }
        }

        // Check standard expiration (exp claim)
        const nowSec = Math.floor(Date.now() / 1000)
        if (typeof payload.exp === 'number' && payload.exp < nowSec) {
            return {
                authenticated: false,
                userId: String(payload.sub || 'unknown'),
                role: 'spectator',
                seriesScope: '[UNBOUND]',
                failureReason: 'EXPIRED_JWT_TOKEN',
            }
        }

        const roleClaim =
            (payload.org_role as string) ||
            (payload.role as string) ||
            'spectator'
        const resolvedRole =
            roleClaim.includes('admin') || roleClaim.includes('showrunner')
                ? 'showrunner_admin'
                : 'spectator'

        const userId = String(payload.sub || 'unknown_user')
        const seriesScope = (payload.series_slug as string) || 'default-series'

        return {
            authenticated: true,
            userId,
            role: resolvedRole,
            seriesScope,
            keyId: header.kid,
        }
    } catch (err: unknown) {
        const message =
            err instanceof Error ? err.message : 'JWT_DECODE_EXCEPTION'
        return {
            authenticated: false,
            userId: 'anonymous',
            role: 'spectator',
            seriesScope: '[UNBOUND]',
            failureReason: message,
        }
    }
}
