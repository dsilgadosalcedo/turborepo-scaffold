# CI and Quality Gates

This monorepo uses Bun for test execution and Turbo for workspace orchestration.

## Test Layers

- `test:unit`: shared package tests, desktop pure-logic tests, and script-level tests
- `test:integration`: isolation-friendly tests for workspace boundaries such as the Electron preload bridge
- `test:e2e`: browser-style route and user-flow tests using React Testing Library and HappyDOM

## Commands

```sh
bun run test
bun run test:unit
bun run test:integration
bun run test:e2e
```

Workspace-local commands are also available in each app or package so Turbo can fan them out in CI.

## Stability Policy

Mock-heavy integration and route-flow tests run file-by-file in isolated Bun processes through `scripts/run-isolated-tests.mjs`. This avoids cross-file leakage from global mocks and keeps the suite predictable as the monorepo grows.

## Recommended CI Order

```sh
bun run lint
bun run format:check
bun run check-types
bun run test:unit
bun run test:integration
bun run test:e2e
bun run build
```

For a single entrypoint, use `bun run ci`.
