import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(currentDir, "..");
const webRoot = path.resolve(desktopRoot, "../web");
const targetRoot = path.join(desktopRoot, ".bundle", "web");
const runtimeConfigPath = path.join(desktopRoot, ".bundle", "runtime-config.json");
const standaloneRoot = path.join(webRoot, ".next", "standalone");
const staticRoot = path.join(webRoot, ".next", "static");
const publicRoot = path.join(webRoot, "public");

if (!existsSync(standaloneRoot)) {
  throw new Error(
    "The Next.js standalone output was not found. Run the web build before packaging the desktop app.",
  );
}

rmSync(path.join(desktopRoot, ".bundle"), { force: true, recursive: true });
mkdirSync(targetRoot, { recursive: true });
cpSync(standaloneRoot, targetRoot, { recursive: true });
writeFileSync(
  runtimeConfigPath,
  JSON.stringify(
    {
      autoUpdateBaseUrl: process.env.AUTO_UPDATE_BASE_URL ?? null,
    },
    null,
    2,
  ),
);

for (const staticTarget of [
  path.join(targetRoot, ".next", "static"),
  path.join(targetRoot, "apps", "web", ".next", "static"),
]) {
  mkdirSync(path.dirname(staticTarget), { recursive: true });

  if (existsSync(staticRoot)) {
    cpSync(staticRoot, staticTarget, { recursive: true });
  }
}

for (const publicTarget of [
  path.join(targetRoot, "public"),
  path.join(targetRoot, "apps", "web", "public"),
]) {
  mkdirSync(path.dirname(publicTarget), { recursive: true });

  if (existsSync(publicRoot)) {
    cpSync(publicRoot, publicTarget, { recursive: true });
  }
}
