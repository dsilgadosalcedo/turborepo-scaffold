import { contextBridge, ipcRenderer } from "electron";
import type { DesktopRuntimeInfo, UpdateState } from "../shared/desktop.js";

const desktopApi = {
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke("desktop:check-for-updates"),
  getRuntimeInfo: (): Promise<DesktopRuntimeInfo> => ipcRenderer.invoke("desktop:get-runtime-info"),
  getUpdateState: (): Promise<UpdateState> => ipcRenderer.invoke("desktop:get-update-state"),
  installUpdate: (): Promise<void> => ipcRenderer.invoke("desktop:install-update"),
  onUpdateState: (callback: (state: UpdateState) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: UpdateState) => callback(state);

    ipcRenderer.on("desktop:update-state", listener);

    return () => {
      ipcRenderer.removeListener("desktop:update-state", listener);
    };
  },
};

contextBridge.exposeInMainWorld("desktop", desktopApi);
