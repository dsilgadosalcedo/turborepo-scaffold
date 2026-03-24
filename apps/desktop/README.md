# desktop

Electron shell for the `web` app.

## Development

`bun dev` at the repo root starts:

- `apps/web` on `http://localhost:3000`
- `apps/desktop`, which opens an Electron window pointed at that Next.js dev server

## Production

`bun build` builds the Next.js standalone output and packages it into Electron.

Distributables are created under:

- `apps/desktop/out/make/...` (share these)

`apps/desktop/dist/...` is build output from `electron-vite`, not the final distributable folder.

## Updates

Packaging is handled with Electron Forge. Auto-updates use Electron's built-in `autoUpdater`
plus Forge-generated update metadata.

Set `AUTO_UPDATE_BASE_URL` during packaging so the app knows where to check for updates after
installation. If you want Forge to publish to S3 as well, set:

- `AUTO_UPDATE_S3_BUCKET`
- `AUTO_UPDATE_S3_REGION`
- `AUTO_UPDATE_S3_FOLDER` (optional)

This app auto-loads env values from:

- `.env` / `.env.local` at repo root
- `apps/desktop/.env` / `apps/desktop/.env.local`

Use `apps/desktop/.env.example` as the template.

For Cloudflare R2, use:

- `AUTO_UPDATE_S3_REGION=auto`
- `AUTO_UPDATE_S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`
- `AUTO_UPDATE_S3_FORCE_PATH_STYLE=true`
- `AUTO_UPDATE_S3_OMIT_ACL=true`
- `AUTO_UPDATE_KEEP_RELEASES=2` (CI cleanup keeps only the latest N versioned artifacts)

plus your R2 access key and secret key.
