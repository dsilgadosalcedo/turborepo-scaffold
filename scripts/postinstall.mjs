import { existsSync, mkdirSync, symlinkSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const rootElectronDir = path.join(projectRoot, "node_modules", "electron");
const desktopNodeModulesDir = path.join(projectRoot, "apps", "desktop", "node_modules");
const desktopElectronDir = path.join(desktopNodeModulesDir, "electron");
const electronInstallScript = path.join(
  desktopElectronDir,
  "install.js",
);
const fallbackElectronInstallScript = path.join(
  projectRoot,
  "node_modules",
  "electron",
  "install.js",
);

if (!existsSync(desktopElectronDir) && existsSync(rootElectronDir)) {
  mkdirSync(desktopNodeModulesDir, { recursive: true });
  symlinkSync(
    rootElectronDir,
    desktopElectronDir,
    process.platform === "win32" ? "junction" : "dir",
  );
}

const installScript = existsSync(electronInstallScript)
  ? electronInstallScript
  : fallbackElectronInstallScript;

if (!existsSync(installScript)) {
  process.exit(0);
}

const result = spawnSync(process.execPath, [installScript], {
  cwd: projectRoot,
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
