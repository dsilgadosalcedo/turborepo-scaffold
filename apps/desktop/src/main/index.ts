import { app, autoUpdater, BrowserWindow, dialog, ipcMain } from "electron";
import { EventEmitter } from "node:events";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { DesktopRuntimeInfo, UpdateState } from "../shared/desktop.js";
import { getStandaloneServerEntry, getUpdateFeedUrl, supportsAutoUpdates } from "./runtime.js";

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

async function ensureStandaloneServer() {
  if (standaloneServerStarted) {
    return;
  }

  const bundledWebRoot = path.join(process.resourcesPath, "web");
  const serverEntry = getStandaloneServerEntry(bundledWebRoot);

  if (!serverEntry) {
    throw new Error(`Could not find the packaged Next.js server entry inside ${bundledWebRoot}.`);
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
  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedUrl) => {
      console.error("Desktop failed to load URL", {
        errorCode,
        errorDescription,
        validatedUrl,
      });
    },
  );

  const appUrl = await getAppUrl();
  await mainWindow.loadURL(appUrl);
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

function handleStartupError(error: unknown) {
  const message = formatError(error);

  console.error("Desktop startup failed", message);

  if (app.isReady()) {
    dialog.showErrorBox("Desktop startup failed", message);
  }
}

function canCheckForUpdates() {
  return Boolean(
    getUpdateFeedUrl({
      arch: process.arch,
      isPackaged: app.isPackaged,
      platform: process.platform,
      runtimeConfigPath,
    }),
  );
}

function checkForUpdates() {
  const feedUrl = getUpdateFeedUrl({
    arch: process.arch,
    isPackaged: app.isPackaged,
    platform: process.platform,
    runtimeConfigPath,
  });

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

app
  .whenReady()
  .then(async () => {
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
  })
  .catch((error) => {
    handleStartupError(error);
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
