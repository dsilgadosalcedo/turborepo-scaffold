# Next Electron Turborepo

Reusable Turborepo boilerplate for teams that want one Next.js application to power both the web experience and the Electron desktop app.

## What This Starter Includes

- `apps/web`: the main Next.js application
- `apps/desktop`: the Electron shell that loads the web app in development and runs the standalone Next.js server in production
- `apps/docs`: a separate Next.js docs app
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
bun run docs
bun run desktop
```

## Updates

The desktop app is wired for background auto-updates on supported platforms:

- Windows uses Squirrel through Electron Forge
- macOS uses Forge ZIP metadata plus Electron's built-in updater

When an update finishes downloading while the app is open, the shared UI can surface an `Actualizar` button so the user can restart and apply it immediately.

## Current Caveat

Electron Forge is the right default for a new Electron app, and this repo is already refactored in that direction. The remaining rough edge is Bun compatibility during Forge packaging in this workspace layout. Development, typechecking, and the shared app architecture are in place, but you should still verify your packaging flow in CI before treating this as a fully polished distribution template.
