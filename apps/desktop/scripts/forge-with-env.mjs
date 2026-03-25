import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getPublisherDiagnostics } from "./env.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(scriptDir, "..");
const desktopBinRoot = path.join(desktopRoot, "node_modules", ".bin");
const repoRoot = path.resolve(desktopRoot, "..", "..");
const forgeCommand = process.argv[2];
const forgeArgs = process.argv.slice(3);
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

function formatCommandForLog(command, args) {
  const renderedArgs = args.map((arg) =>
    /\s/u.test(arg) ? JSON.stringify(arg) : arg,
  );

  return [command, ...renderedArgs].join(" ");
}

function getPlatformCommand(command) {
  if (command === "electron-vite" || command === "electron-forge") {
    const localBinary = path.join(
      desktopBinRoot,
      `${command}${process.platform === "win32" ? ".cmd" : ""}`,
    );

    if (existsSync(localBinary)) {
      return localBinary;
    }
  }

  if (process.platform !== "win32") {
    return command;
  }

  if (command === "npm") {
    return `${command}.cmd`;
  }

  return command;
}

function runStep(command, args = []) {
  const platformCommand = getPlatformCommand(command);
  const renderedCommand = formatCommandForLog(platformCommand, args);
  const useShell =
    process.platform === "win32" && platformCommand.toLowerCase().endsWith(".cmd");
  console.log(`[desktop-release] START ${renderedCommand}`);
  const result = spawnSync(platformCommand, args, {
    cwd: desktopRoot,
    env: process.env,
    shell: useShell,
    stdio: "inherit",
  });

  if (typeof result.status === "number" && result.status !== 0) {
    console.error(`[desktop-release] FAIL ${renderedCommand} (exit=${result.status})`);
    process.exit(result.status);
  }

  if (result.error) {
    throw result.error;
  }

  console.log(`[desktop-release] DONE ${renderedCommand}`);
}

function logEnvDiagnostics() {
  const publisherDiagnostics = getPublisherDiagnostics({
    requirePublish: forgeCommand === "publish",
  });

  console.log(
    "[desktop-release] context",
    JSON.stringify(
      {
        autoUpdateBaseUrlPresent: Boolean(process.env.AUTO_UPDATE_BASE_URL?.trim()),
        bucket: publisherDiagnostics.bucket,
        command: forgeCommand,
        endpoint: publisherDiagnostics.endpoint,
        folder: publisherDiagnostics.folder,
        forgeArgs,
        publisherTargets: publisherDiagnostics.publisherTargets,
        requirePublish: publisherDiagnostics.requirePublish,
        shouldPublish: publisherDiagnostics.shouldPublish,
      },
      null,
      2,
    ),
  );
}

function ensureMacDmgNativeModules() {
  if (process.platform !== "darwin") {
    return;
  }

  if (forgeCommand !== "make" && forgeCommand !== "publish") {
    return;
  }

  runStep("npm", ["rebuild", "macos-alias", "fs-xattr"]);
}

if (!allowedForgeCommands.has(forgeCommand)) {
  throw new Error(
    `Invalid forge command "${forgeCommand}". Use one of: ${Array.from(allowedForgeCommands).join(", ")}.`,
  );
}

loadEnvFiles();
process.env.DESKTOP_FORGE_COMMAND = forgeCommand;
logEnvDiagnostics();

runStep(process.execPath, ["./scripts/prepare-web-bundle.mjs"]);
runStep("electron-vite", ["build"]);
ensureMacDmgNativeModules();

if (forgeCommand === "publish") {
  console.log(
    '[desktop-release] START electron-forge publish (if publisher phase is reached, Forge will print "Publishing to the following targets: s3")',
  );
}

runStep("electron-forge", [forgeCommand, ...forgeArgs]);
