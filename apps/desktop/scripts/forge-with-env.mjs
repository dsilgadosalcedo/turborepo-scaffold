import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(desktopRoot, "..", "..");
const forgeCommand = process.argv[2];
const allowedForgeCommands = new Set(["make", "package", "publish"]);
const initialEnvKeys = new Set(Object.keys(process.env));

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalizedLine = line.startsWith("export ") ? line.slice(7) : line;
    const separatorIndex = normalizedLine.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(key)) {
      continue;
    }

    let value = normalizedLine.slice(separatorIndex + 1).trim();

    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1).replace(/\\n/gu, "\n");
    } else if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
      value = value.slice(1, -1);
    }

    if (initialEnvKeys.has(key)) {
      continue;
    }

    process.env[key] = value;
  }
}

function loadEnvFiles() {
  const envCandidates = [
    path.join(repoRoot, ".env"),
    path.join(repoRoot, ".env.local"),
    path.join(desktopRoot, ".env"),
    path.join(desktopRoot, ".env.local"),
  ];

  for (const filePath of envCandidates) {
    if (existsSync(filePath)) {
      parseEnvFile(filePath);
    }
  }
}

function runStep(command) {
  const result = spawnSync(command, {
    cwd: desktopRoot,
    env: process.env,
    shell: true,
    stdio: "inherit",
  });

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.error) {
    throw result.error;
  }
}

if (!allowedForgeCommands.has(forgeCommand)) {
  throw new Error(
    `Invalid forge command "${forgeCommand}". Use one of: ${Array.from(allowedForgeCommands).join(", ")}.`,
  );
}

loadEnvFiles();

runStep(`${process.execPath} ./scripts/prepare-web-bundle.mjs`);
runStep("electron-vite build");
runStep(`electron-forge ${forgeCommand}`);
