import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import tailwindcss from '@tailwindcss/vite'
import clerk from '@clerk/astro'
import react from '@astrojs/react'

function edgeCompatibilityPlugin() {
    return {
        name: 'edge-compatibility',
        enforce: 'post',
        generateBundle(options, bundle) {
            for (const key in bundle) {
                if (
                    bundle[key].type === 'chunk' &&
                    (key.includes('middleware') || key.includes('worker'))
                ) {
                    let code = bundle[key].code

                    // 1. Mock 'fs' and 'node:fs' as a local variable
                    // We use 'var' to allow for broad scoping within the chunk after hoisting
                    const fsMock =
                        'var fs = { existsSync: () => false, readFileSync: () => "" };'
                    code = code.replace(
                        /import\s+\*\s+as\s+fs\s+from\s+["'](node:)?fs["'];?/gi,
                        fsMock,
                    )

                    // 2. Ensure other Node built-ins use the 'node:' prefix for Cloudflare compatibility
                    code = code.replace(
                        /import\s+\*\s+as\s+(\w+)\s+from\s+["'](path|events|crypto|stream|util|buffer)["'];?/gi,
                        'import * as $1 from "node:$2";',
                    )

                    // 3. Fix ESM Hoisting: Move ONLY 'import' statements to the very top.
                    // This prevents the "import declarations must come before any other statements" error
                    // caused by adapter-injected shims like 'globalThis.process'.
                    const lines = code.split('\n')
                    const importLines = []
                    const restLines = []

                    for (const line of lines) {
                        if (line.trim().startsWith('import ')) {
                            importLines.push(line)
                        } else {
                            restLines.push(line)
                        }
                    }

                    bundle[key].code = [...importLines, ...restLines].join('\n')

                    // Assert zero forbidden node globals leaked into edge entrypoint
                    if (bundle[key].code.includes('process.binding(')) {
                        throw new Error(
                            `[EDGE_BUNDLE_LEAK] Node binding leaked in ${key}`,
                        )
                    }
                }
            }
        },
    }
}

export default defineConfig({
    output: 'server',
    adapter: cloudflare({
        prerenderEnvironment: 'node',
    }),
    integrations: [clerk(), react()],
    vite: {
        plugins: [tailwindcss(), edgeCompatibilityPlugin()],
        server: {
            host: '0.0.0.0',
            port: 3000,
            allowedHosts: true,
        },
        ssr: {
            noExternal: [/@clerk/],
            external: [
                'node:path',
                'node:events',
                'node:crypto',
                'node:stream',
                'node:util',
                'node:buffer',
                'node:async_hooks',
            ],
        },
    },
})
