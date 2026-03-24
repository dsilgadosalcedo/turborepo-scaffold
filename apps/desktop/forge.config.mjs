const autoUpdateBaseUrl = process.env.AUTO_UPDATE_BASE_URL;
const s3Bucket = process.env.AUTO_UPDATE_S3_BUCKET;
const s3Folder = process.env.AUTO_UPDATE_S3_FOLDER;
const s3Region = process.env.AUTO_UPDATE_S3_REGION;

/** @type {import("@electron-forge/shared-types").ForgeConfig} */
const config = {
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
      config: (arch) =>
        autoUpdateBaseUrl
          ? {
              macUpdateManifestBaseUrl: `${autoUpdateBaseUrl}/darwin/${arch}`,
            }
          : {},
    },
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: (arch) => ({
        authors: "Next Electron Turborepo",
        description: "Electron shell for the shared Next.js application",
        name: "NextElectronTurborepo",
        remoteReleases: autoUpdateBaseUrl ? `${autoUpdateBaseUrl}/win32/${arch}` : undefined,
      }),
    },
  ],
  packagerConfig: {
    asar: true,
    extraResource: [".bundle/web", ".bundle/runtime-config.json"],
    prune: true,
    ignore: [
      /^\/\.electron\/renderer($|\/)/,
      /^\/electron\.vite\.config\.ts$/,
      /^\/forge\.config\.mjs$/,
      /^\/\.bundle($|\/)/,
      /^\/scripts($|\/)/,
      /^\/src($|\/)/,
      /^\/tsconfig.*$/,
      /^\/node_modules($|\/)/,
    ],
  },
  publishers:
    s3Bucket && s3Region
      ? [
          {
            name: "@electron-forge/publisher-s3",
            config: {
              bucket: s3Bucket,
              folder: s3Folder,
              public: true,
              region: s3Region,
            },
          },
        ]
      : [],
};

export default config;
