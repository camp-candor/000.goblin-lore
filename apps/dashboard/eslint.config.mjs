import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginAstro from 'eslint-plugin-astro'
import globals from 'globals'

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...eslintPluginAstro.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.vitest,
            },
        },
    },
    {
        ignores: [
            'vcode/**',
            'node_modules/**',
            '.astro/**',
            'dist/**',
            'public/jsx/**',
            '.wrangler/**',
            '.github/**',
            'src/test/verify-middleware.mjs',
        ],
    },
    {
        files: ['src/test/**/*.ts', 'src/middleware.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
        },
    },
    {
        // Intentional control-character classes in the edge sanitizer regexes
        files: [
            'src/lib/security/sandboxGuard.ts',
            'src/lib/routing/deepLinkBridge.ts',
        ],
        rules: {
            'no-control-regex': 'off',
        },
    },
    {
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/no-empty-object-type': 'off',
            // Allow console and process in our specialized test/middleware files
            'no-console': 'off',
        },
    },
)
