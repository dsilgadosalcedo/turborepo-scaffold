# Next Electron Turborepo

Reusable Turborepo boilerplate for teams that want one Next.js application to power both the web experience and the Electron desktop app.

## What This Starter Includes

- `apps/web`: the main Next.js application
- `apps/desktop`: the Electron shell that loads the web app in development and runs the standalone Next.js server in production
- `apps/marketing`: a separate Next.js marketing app for download, pricing, overview, and public pages
- `packages/ui`: shared shadcn-style UI primitives used across apps
- `packages/typescript-config`: shared TypeScript configuration

## Architecture

### Development

Run `bun dev`.

Turbo starts the web app on `http://127.0.0.1:3000`, and Electron opens that URL directly. You work on the Next.js app once, and the browser and desktop window both reflect the same hot-reloaded UI.

### Production

Run `bun build`.

The web app is built with `output: "standalone"`, then the desktop build bundles that standalone Next.js server into Electron. In production, Electron starts the packaged Next.js server on an internal localhost port and loads it in the app window. That keeps API routes, server actions, and other server-side features available inside the desktop app.

## Tooling

- `bun` for workspace management
- `turbo` for monorepo orchestration
- `oxlint` for linting across the repo
- `oxfmt` for formatting across the repo
- `electron-vite` for the Electron build pipeline
- `electron-forge` for packaging and distribution

## Commands

```sh
bun install
bun dev
bun build
bun run lint
bun run format
bun run check-types
```

Useful app-specific commands:

```sh
bun run web
bun run marketing
bun run desktop
```

## Updates

The desktop app is wired for background auto-updates on supported platforms:

- Windows uses Squirrel through Electron Forge
- macOS uses Forge ZIP metadata plus Electron's built-in updater

When an update finishes downloading while the app is open, the shared UI can surface an `Actualizar` button so the user can restart and apply it immediately.

### Update Configuration

`apps/desktop` now auto-loads env variables from:

- `.env` (repo root)
- `.env.local` (repo root)
- `apps/desktop/.env`
- `apps/desktop/.env.local`

Shell/CI variables still win over file values.

Minimum variable:

- `AUTO_UPDATE_BASE_URL` (example: `https://downloads.example.com/myapp`)

For Cloudflare R2 publishing through Forge, also set:

- `AUTO_UPDATE_S3_BUCKET`
- `AUTO_UPDATE_S3_REGION=auto`
- `AUTO_UPDATE_S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`
- `AUTO_UPDATE_S3_ACCESS_KEY_ID`
- `AUTO_UPDATE_S3_SECRET_ACCESS_KEY`
- optional: `AUTO_UPDATE_S3_FOLDER`, `AUTO_UPDATE_S3_FORCE_PATH_STYLE=true`, `AUTO_UPDATE_S3_OMIT_ACL=true`
- optional: `AUTO_UPDATE_KEEP_RELEASES=2` (CI keeps only the latest N versioned artifacts)

See `apps/desktop/.env.example` for the full template.

### CI Release

Use the GitHub Actions workflow at `.github/workflows/desktop-release.yml` to build/publish macOS + Windows artifacts without a local Windows machine. Add the matching repository secrets first.

## Packaging Notes

The desktop app now targets ZIP + DMG on macOS and Squirrel installers on Windows. ZIP artifacts remain important for the macOS auto-update feed, while DMG gives you the more polished first-download experience most users expect.

## Public Routing

If you deploy `apps/web` and `apps/marketing` as separate Vercel projects, `apps/web` can still own the public product domain and proxy selected marketing routes to the marketing deployment.

- Set `MARKETING_ORIGIN` on the web project to the deployed marketing origin.
- Set `NEXT_PUBLIC_PRODUCT_WEB_URL` on the marketing project to the deployed product origin.
- Set `AUTO_UPDATE_BASE_URL` anywhere the marketing download page or desktop packaging runs.
- The default `/download` rewrite now forwards from the product app to the marketing app.
- These public routing and download variables are validated at build time and should fail fast when missing.
- The publish-only `AUTO_UPDATE_S3_*` variables are enforced only for desktop publish and release cleanup boundaries.
