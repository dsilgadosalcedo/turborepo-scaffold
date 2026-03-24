import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const electronInstallScript = path.join(
  projectRoot,
  "apps",
  "desktop",
  "node_modules",
  "electron",
  "install.js",
);

if (!existsSync(electronInstallScript)) {
  process.exit(0);
}

const result = spawnSync(process.execPath, [electronInstallScript], {
  cwd: projectRoot,
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
