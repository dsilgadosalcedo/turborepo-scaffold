# desktop

Electron shell for the `web` app.

## Development

`bun dev` at the repo root starts:

- `apps/web` on `http://localhost:3000`
- `apps/desktop`, which opens an Electron window pointed at that Next.js dev server

## Production

`bun build` builds the Next.js standalone output and packages it into Electron.

## Updates

Packaging is handled with Electron Forge. Auto-updates use Electron's built-in `autoUpdater`
plus Forge-generated update metadata.

Set `AUTO_UPDATE_BASE_URL` during packaging so the app knows where to check for updates after
installation. If you want Forge to publish to S3 as well, set:

- `AUTO_UPDATE_S3_BUCKET`
- `AUTO_UPDATE_S3_REGION`
- `AUTO_UPDATE_S3_FOLDER` (optional)
