import { contextBridge, ipcRenderer } from "electron";
import type { DesktopRuntimeInfo, UpdateState } from "../shared/desktop.js";

type DesktopApi = {
  checkForUpdates: () => Promise<void>;
  getRuntimeInfo: () => Promise<DesktopRuntimeInfo>;
  getUpdateState: () => Promise<UpdateState>;
  installUpdate: () => Promise<void>;
  onUpdateState: (callback: (state: UpdateState) => void) => () => void;
};

type DesktopBridge = Pick<typeof contextBridge, "exposeInMainWorld">;
type DesktopRenderer = Pick<typeof ipcRenderer, "invoke" | "on" | "removeListener">;

export function createDesktopApi(renderer: DesktopRenderer = ipcRenderer): DesktopApi {
  return {
    checkForUpdates: (): Promise<void> => renderer.invoke("desktop:check-for-updates"),
    getRuntimeInfo: (): Promise<DesktopRuntimeInfo> => renderer.invoke("desktop:get-runtime-info"),
    getUpdateState: (): Promise<UpdateState> => renderer.invoke("desktop:get-update-state"),
    installUpdate: (): Promise<void> => renderer.invoke("desktop:install-update"),
    onUpdateState: (callback: (state: UpdateState) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, state: UpdateState) => callback(state);

      renderer.on("desktop:update-state", listener);

      return () => {
        renderer.removeListener("desktop:update-state", listener);
      };
    },
  };
}

export function registerDesktopApi(
  bridge: DesktopBridge = contextBridge,
  renderer: DesktopRenderer = ipcRenderer,
) {
  const desktopApi = createDesktopApi(renderer);

  bridge.exposeInMainWorld("desktop", desktopApi);

  return desktopApi;
}

registerDesktopApi();
