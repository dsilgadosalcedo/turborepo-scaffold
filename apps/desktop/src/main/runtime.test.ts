import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  getStandaloneServerEntry,
  getUpdateFeedUrl,
  readAutoUpdateBaseUrl,
  supportsAutoUpdates,
} from "./runtime.js";

let tempDir: string | null = null;

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { force: true, recursive: true });
    tempDir = null;
  }
});

describe("runtime helpers", () => {
  test("getStandaloneServerEntry prefers the packaged app server path", () => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "desktop-runtime-"));

    const standaloneDir = path.join(tempDir, "apps", "web");
    mkdirSync(standaloneDir, { recursive: true });
    writeFileSync(path.join(standaloneDir, "server.js"), "console.log('server');");

    expect(getStandaloneServerEntry(tempDir)).toBe(path.join(standaloneDir, "server.js"));
  });

  test("getStandaloneServerEntry falls back to a root server.js", () => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "desktop-runtime-"));

    writeFileSync(path.join(tempDir, "server.js"), "console.log('server');");

    expect(getStandaloneServerEntry(tempDir)).toBe(path.join(tempDir, "server.js"));
  });

  test("readAutoUpdateBaseUrl reads the configured base URL", () => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "desktop-runtime-"));

    const runtimeConfigPath = path.join(tempDir, "runtime-config.json");
    writeFileSync(
      runtimeConfigPath,
      JSON.stringify({ autoUpdateBaseUrl: "https://downloads.example.com/app" }),
    );

    expect(readAutoUpdateBaseUrl(runtimeConfigPath)).toBe("https://downloads.example.com/app");
  });

  test("getUpdateFeedUrl returns null when updates are unsupported", () => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "desktop-runtime-"));

    const runtimeConfigPath = path.join(tempDir, "runtime-config.json");
    writeFileSync(
      runtimeConfigPath,
      JSON.stringify({ autoUpdateBaseUrl: "https://downloads.example.com/app" }),
    );

    expect(
      getUpdateFeedUrl({
        arch: "x64",
        isPackaged: true,
        platform: "linux",
        runtimeConfigPath,
      }),
    ).toBeNull();
  });

  test("supportsAutoUpdates only enables darwin and win32", () => {
    expect(supportsAutoUpdates("darwin")).toBe(true);
    expect(supportsAutoUpdates("win32")).toBe(true);
    expect(supportsAutoUpdates("linux")).toBe(false);
  });
});
