import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const { default: DownloadPage } = await import("../../app/download/page");

describe("marketing download page", () => {
  test("renders release download links from the desktop version", () => {
    const previousBaseUrl = process.env.AUTO_UPDATE_BASE_URL;
    process.env.AUTO_UPDATE_BASE_URL = "https://downloads.example.com/scaffold";

    try {
      const markup = renderToStaticMarkup(<DownloadPage />);

      expect(markup).toContain("Current desktop version: v0.1.0");
      expect(markup).toContain(
        "https://downloads.example.com/scaffold/darwin/arm64/desktop-0.1.0-arm64.dmg",
      );
      expect(markup).toContain(
        "https://downloads.example.com/scaffold/darwin/x64/desktop-0.1.0-x64.dmg",
      );
      expect(markup).toContain(
        "https://downloads.example.com/scaffold/win32/x64/NextElectronTurborepo-0.1.0 Setup.exe",
      );
    } finally {
      if (previousBaseUrl === undefined) {
        delete process.env.AUTO_UPDATE_BASE_URL;
      } else {
        process.env.AUTO_UPDATE_BASE_URL = previousBaseUrl;
      }
    }
  });
});
