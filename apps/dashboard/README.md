# @camp_candor/dashboard (goblin-lore)

Astro + Cloudflare SSR application powering the Goblin Lore web cockpit.

Ported from the reference dashboard template as a minimal scaffold: configs,
edge middleware, security libs, chrome layouts, status landing.
Upstream-specific islands (React), genesis flows, and e2e suites were
intentionally left out.

## Features

- **Astro SSR with Cloudflare Adapter**: Edge runtime deployment configured via
  `@astrojs/cloudflare` and `wrangler.jsonc` (`goblin-lore-dashboard`).
- **Clerk Authentication**: Dynamic middleware integration for session
  orchestration and role gating.
- **Tailwind CSS v4**: Modern utility-first styling with `@tailwindcss/vite`.
- **V8 Boundary Shield Verification**: Guard scan ensuring no unsupported Node
  built-ins enter production client bundles.

## Scripts

Run commands either directly in `apps/dashboard` or from the monorepo root
(`npm run dashboard:dev`, `npm run test:dashboard`):

| Command                 | Action                                              |
| :---------------------- | :-------------------------------------------------- |
| `npm run dev`           | Start local Astro development server (port 3000)    |
| `npm run build`         | Build SSR application and client assets to `dist/`  |
| `npm run preview`       | Run production bundle locally via Wrangler          |
| `npm run deploy`        | Build and deploy to Cloudflare                      |
| `npm run verify:bundle` | Scan production bundle for unsupported Node imports |
| `npm run test`          | Run unit test suite (Vitest)                        |
