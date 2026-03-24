import { defineConfig } from "electron-vite";

export default defineConfig({
  main: {
    build: {
      outDir: ".electron/main",
    },
  },
  preload: {
    build: {
      outDir: ".electron/preload",
    },
  },
  renderer: {
    build: {
      outDir: ".electron/renderer",
    },
  },
});
