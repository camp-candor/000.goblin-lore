import { defineConfig } from 'astro/config'
import node from '@astrojs/node'
import tailwindcss from '@tailwindcss/vite'
import clerk from '@clerk/astro'

export default defineConfig({
    output: 'server',
    adapter: node({
        mode: 'standalone',
    }),
    integrations: [clerk()],
    vite: {
        plugins: [tailwindcss()],
        server: {
            host: '0.0.0.0',
            port: 3000,
            allowedHosts: true,
        },
        ssr: {
            noExternal: [/@clerk/],
            external: [
                'node:fs',
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
