import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const desktopPackagePath = path.resolve(process.cwd(), "..", "desktop", "package.json");
const desktopVersion = JSON.parse(readFileSync(desktopPackagePath, "utf8")).version as string;

mock.module("../../env.js", () => ({
  env: {
    AUTO_UPDATE_BASE_URL: "https://downloads.example.com/scaffold",
    NEXT_PUBLIC_PRODUCT_WEB_URL: "https://turborepo-scaffold-web.vercel.app",
  },
}));

const { default: DownloadPage } = await import("../../app/download/page");

describe("marketing download page", () => {
  test("renders release download links from the desktop version", () => {
    const markup = renderToStaticMarkup(<DownloadPage />);

    expect(markup).toContain(`Current desktop version: v${desktopVersion}`);
    expect(markup).toContain(
      `https://downloads.example.com/scaffold/darwin/arm64/desktop-${desktopVersion}-arm64.dmg`,
    );
    expect(markup).toContain(
      `https://downloads.example.com/scaffold/darwin/x64/desktop-${desktopVersion}-x64.dmg`,
    );
    expect(markup).toContain(
      `https://downloads.example.com/scaffold/win32/x64/NextElectronTurborepo-${desktopVersion} Setup.exe`,
    );
  });
});
