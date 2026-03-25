import { describe, expect, mock, test } from "bun:test";

const exposeCalls: Array<{ api: unknown; key: string }> = [];

mock.module("electron", () => ({
  contextBridge: {
    exposeInMainWorld(key: string, api: unknown) {
      exposeCalls.push({ api, key });
    },
  },
  ipcRenderer: {
    invoke() {
      return Promise.resolve(undefined);
    },
    on() {},
    removeListener() {},
  },
}));

const { createDesktopApi, registerDesktopApi } = await import("../../src/preload/index.ts");

describe("desktop preload bridge", () => {
  test("registerDesktopApi exposes the desktop contract", () => {
    expect(exposeCalls).toHaveLength(1);
    expect(exposeCalls[0]?.key).toBe("desktop");
    expect(exposeCalls[0]?.api).toBeDefined();

    const extraExposeCalls: Array<{ api: unknown; key: string }> = [];

    registerDesktopApi(
      {
        exposeInMainWorld(key, api) {
          extraExposeCalls.push({ api, key });
        },
      },
      {
        invoke: async () => undefined,
        on() {},
        removeListener() {},
      },
    );

    expect(extraExposeCalls).toHaveLength(1);
    expect(extraExposeCalls[0]?.key).toBe("desktop");
  });

  test("createDesktopApi wires invoke calls and unsubscribes listeners", async () => {
    const customOnCalls: Array<{ channel: string; listener: (...args: unknown[]) => void }> = [];
    const customRemoveCalls: Array<{ channel: string; listener: (...args: unknown[]) => void }> =
      [];
    const invokedChannels: string[] = [];

    const api = createDesktopApi({
      invoke(channel) {
        invokedChannels.push(channel);
        return Promise.resolve(undefined);
      },
      on(channel, listener) {
        customOnCalls.push({ channel, listener });
      },
      removeListener(channel, listener) {
        customRemoveCalls.push({ channel, listener });
      },
    });

    await api.checkForUpdates();
    await api.getRuntimeInfo();
    await api.getUpdateState();
    await api.installUpdate();

    expect(invokedChannels).toEqual([
      "desktop:check-for-updates",
      "desktop:get-runtime-info",
      "desktop:get-update-state",
      "desktop:install-update",
    ]);

    let emittedState: { status: string } | null = null;
    const unsubscribe = api.onUpdateState((state) => {
      emittedState = state;
    });

    expect(customOnCalls).toHaveLength(1);
    expect(customOnCalls[0]?.channel).toBe("desktop:update-state");

    customOnCalls[0]?.listener(undefined, { status: "downloaded" });
    expect(emittedState).toEqual({ status: "downloaded" });

    unsubscribe();

    expect(customRemoveCalls).toHaveLength(1);
    expect(customRemoveCalls[0]?.channel).toBe("desktop:update-state");
  });
});
