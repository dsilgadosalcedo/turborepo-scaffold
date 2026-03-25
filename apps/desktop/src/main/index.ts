import { app, autoUpdater, BrowserWindow, ipcMain } from "electron";
import { EventEmitter } from "node:events";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { DesktopRuntimeInfo, UpdateState } from "../shared/desktop.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const devServerUrl = "http://127.0.0.1:3000";
const packagedServerPort = 31234;
const runtimeConfigPath = path.join(process.resourcesPath, "runtime-config.json");
let mainWindow: BrowserWindow | null = null;
let standaloneServerStarted = false;
let updateState: UpdateState = { status: "idle" };
const updaterEvents = autoUpdater as EventEmitter;

if (process.platform === "win32") {
  const { default: electronSquirrelStartup } = await import("electron-squirrel-startup");

  if (electronSquirrelStartup) {
    app.quit();
  }
}

function broadcastUpdateState() {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send("desktop:update-state", updateState);
  }
}

function setUpdateState(nextState: UpdateState) {
  updateState = nextState;
  broadcastUpdateState();
}

function getRuntimeInfo(): DesktopRuntimeInfo {
  return {
    currentVersion: app.getVersion(),
    isDesktop: true,
    isPackaged: app.isPackaged,
    supportsAutoUpdates: supportsAutoUpdates(),
    updateState,
  };
}

async function waitForUrl(url: string) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`The development server at ${url} did not become ready.`);
}

function findServerEntry(rootDir: string): string | null {
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current)) {
      const fullPath = path.join(current, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry === "server.js") {
        return fullPath;
      }
    }
  }

  return null;
}

async function ensureStandaloneServer() {
  if (standaloneServerStarted) {
    return;
  }

  const bundledWebRoot = path.join(process.resourcesPath, "web");
  const serverEntry = findServerEntry(bundledWebRoot);

  if (!serverEntry) {
    throw new Error(`Could not find a standalone Next.js server inside ${bundledWebRoot}.`);
  }

  process.env.HOSTNAME = "127.0.0.1";
  process.env.NODE_ENV = "production";
  process.env.PORT = String(packagedServerPort);

  await import(pathToFileURL(serverEntry).href);
  await waitForUrl(`http://127.0.0.1:${packagedServerPort}`);

  standaloneServerStarted = true;
}

async function getAppUrl() {
  if (!app.isPackaged) {
    await waitForUrl(devServerUrl);
    return devServerUrl;
  }

  await ensureStandaloneServer();
  return `http://127.0.0.1:${packagedServerPort}`;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 760,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#f5efe6",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(currentDir, "../preload/index.mjs"),
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  const appUrl = await getAppUrl();
  await mainWindow.loadURL(appUrl);
}

function getAutoUpdateBaseUrl() {
  if (!app.isPackaged || !existsSync(runtimeConfigPath)) {
    return null;
  }

  try {
    const rawConfig = readFileSync(runtimeConfigPath, "utf8");
    const parsed = JSON.parse(rawConfig) as { autoUpdateBaseUrl?: string | null };

    return parsed.autoUpdateBaseUrl ?? null;
  } catch {
    return null;
  }
}

function supportsAutoUpdates() {
  return process.platform === "darwin" || process.platform === "win32";
}

function getUpdateFeedUrl() {
  const baseUrl = getAutoUpdateBaseUrl();

  if (!baseUrl || !supportsAutoUpdates()) {
    return null;
  }

  return `${baseUrl}/${process.platform}/${process.arch}`;
}

function canCheckForUpdates() {
  return Boolean(app.isPackaged && getUpdateFeedUrl());
}

function checkForUpdates() {
  const feedUrl = getUpdateFeedUrl();

  if (!feedUrl) {
    return;
  }

  autoUpdater.setFeedURL({ url: feedUrl });
  setUpdateState({ status: "checking" });
  try {
    autoUpdater.checkForUpdates();
  } catch {
    setUpdateState({ status: "error" });
  }
}

function triggerUpdateCheck() {
  if (!canCheckForUpdates()) {
    return;
  }

  checkForUpdates();
}

function setupAutoUpdates() {
  updaterEvents.on("checking-for-update", () => {
    setUpdateState({ status: "checking" });
  });

  updaterEvents.on("update-available", (...args: unknown[]) => {
    const maybeInfo = args.at(-1);
    const version =
      typeof maybeInfo === "object" && maybeInfo && "version" in maybeInfo
        ? String(maybeInfo.version)
        : undefined;

    setUpdateState({ status: "available", version });
  });

  updaterEvents.on("update-not-available", () => {
    setUpdateState({ status: "not-available" });
  });

  updaterEvents.on("download-progress", (progress: { percent?: number }) => {
    setUpdateState({
      percent: progress.percent,
      status: "downloading",
    });
  });

  updaterEvents.on("update-downloaded", (...args: unknown[]) => {
    const maybeInfo = args.at(-1);
    const version =
      typeof maybeInfo === "object" && maybeInfo && "version" in maybeInfo
        ? String(maybeInfo.version)
        : undefined;

    setUpdateState({ status: "downloaded", version });
  });

  updaterEvents.on("error", () => {
    setUpdateState({ status: "error" });
  });

  checkForUpdates();
  setInterval(checkForUpdates, 4 * 60 * 60 * 1000);
}

app.whenReady().then(async () => {
  app.setAppUserModelId("com.squirrel.NextElectronTurborepo.NextElectronTurborepo");

  ipcMain.handle("desktop:get-runtime-info", () => getRuntimeInfo());
  ipcMain.handle("desktop:get-update-state", () => updateState);
  ipcMain.handle("desktop:check-for-updates", () => {
    triggerUpdateCheck();
  });
  ipcMain.handle("desktop:install-update", () => {
    if (updateState.status === "downloaded") {
      autoUpdater.quitAndInstall();
    }
  });

  if (canCheckForUpdates()) {
    setupAutoUpdates();
  }

  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
