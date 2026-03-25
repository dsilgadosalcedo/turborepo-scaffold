# Marketing App

Public-facing Next.js app for the scaffold project.

This workspace is intentionally separate from `apps/web` so overview pages, pricing, guides,
changelog entries, and download routes do not get bundled into the desktop application.

## Commands

```sh
bun run dev
bun run build
bun run test:e2e
```

## Runtime Environment

- `AUTO_UPDATE_BASE_URL`: required base URL used to compose installer download links
- `NEXT_PUBLIC_PRODUCT_WEB_URL`: required canonical URL for the product web app

Recommended when deploying separately:

- `AUTO_UPDATE_BASE_URL=https://downloads.example.com/myapp`
- `NEXT_PUBLIC_PRODUCT_WEB_URL=https://turborepo-scaffold-web.vercel.app`
