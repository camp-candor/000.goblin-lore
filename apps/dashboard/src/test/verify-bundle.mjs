import fs from 'node:fs'
import path from 'node:path'

/**
 * V8_BOUNDARY_SHIELD_SCAN
 *
 * Scans the CLIENT-SIDE production bundle for forbidden Node.js imports.
 * The server-side Worker bundle (dist/_worker.js/) intentionally uses
 * node:path, node:events, etc. via Cloudflare's nodejs_compat flag --
 * these are explicitly externalised in astro.config.mjs and are safe.
 *
 * What IS forbidden: node:fs and node:os, which have no Cloudflare Worker
 * equivalent and will crash the runtime if bundled into any output.
 * These are checked across both client AND server bundles.
 */

const distDir = path.resolve('dist')

if (!fs.existsSync(distDir)) {
    console.error(`ERROR: Build directory not found at ${distDir}`)
    console.error('Did you run "npm run build" first?')
    process.exit(1)
}

//  RULES
// Checked everywhere (client + server): truly unsupported Cloudflare modules
const universalForbidden = [
    {
        pattern: /import\s+.*\s+from\s+["'](node:)?fs["']/g,
        name: 'node:fs (unsupported in Workers)',
    },
    {
        pattern: /require\(["'](node:)?fs["']\)/g,
        name: 'node:fs via require (unsupported in Workers)',
    },
    {
        pattern: /import\s+.*\s+from\s+["'](node:)?os["']/g,
        name: 'node:os (unsupported in Workers)',
    },
]

// Checked ONLY in client assets: server Worker bundle uses these legitimately
const clientOnlyForbidden = [
    {
        pattern: /import\s+.*\s+from\s+["']node:path["']/g,
        name: 'node:path (server-only; must not reach client bundle)',
    },
    {
        pattern: /import\s+.*\s+from\s+["']node:events["']/g,
        name: 'node:events (server-only; must not reach client bundle)',
    },
]

//  DIRS
// Client assets: built by Vite for the browser
const clientAssetsDir = path.join(distDir, '_astro')

let foundError = false

function scanDir(dir, patterns, label) {
    if (!fs.existsSync(dir)) return

    const files = fs.readdirSync(dir)
    for (const file of files) {
        const fullPath = path.join(dir, file)
        const stats = fs.statSync(fullPath)

        if (stats.isDirectory()) {
            scanDir(fullPath, patterns, label)
        } else if (file.endsWith('.mjs') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf-8')
            patterns.forEach(({ pattern, name }) => {
                // Reset regex state between files
                pattern.lastIndex = 0
                const matches = content.match(pattern)
                if (matches) {
                    console.error(
                        `[FAIL][${label}] ${file}: Found forbidden module: ${name}`,
                    )
                    matches.forEach((m) => console.error(`       > ${m}`))
                    foundError = true
                }
            })
        }
    }
}

console.log('--- V8_BOUNDARY_SHIELD_SCAN ---')

// Pass 1: Universal scan (fs + os) across the entire dist
console.log('\n[PASS 1] Universal scan (node:fs, node:os) -- full dist/')
scanDir(distDir, universalForbidden, 'UNIVERSAL')

// Pass 2: Client-only scan (path, events) -- browser assets only
console.log(
    '\n[PASS 2] Client-asset scan (node:path, node:events) -- dist/_astro/',
)
scanDir(clientAssetsDir, clientOnlyForbidden, 'CLIENT')

if (foundError) {
    console.error(
        '\nERROR: V8 boundary breached. Forbidden modules detected in production bundle.',
    )
    process.exit(1)
} else {
    console.log('\n[SUCCESS] Production bundle isolation confirmed.')
    process.exit(0)
}
