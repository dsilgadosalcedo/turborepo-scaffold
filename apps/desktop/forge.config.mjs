const autoUpdateBaseUrl = process.env.AUTO_UPDATE_BASE_URL;
const s3Bucket = process.env.AUTO_UPDATE_S3_BUCKET;
const s3Folder = process.env.AUTO_UPDATE_S3_FOLDER;
const s3Region = process.env.AUTO_UPDATE_S3_REGION;
const s3AccessKeyId = process.env.AUTO_UPDATE_S3_ACCESS_KEY_ID;
const s3SecretAccessKey = process.env.AUTO_UPDATE_S3_SECRET_ACCESS_KEY;
const s3SessionToken = process.env.AUTO_UPDATE_S3_SESSION_TOKEN;
const s3Endpoint = process.env.AUTO_UPDATE_S3_ENDPOINT;
const s3ForcePathStyle = process.env.AUTO_UPDATE_S3_FORCE_PATH_STYLE === "true";
const shouldOmitAcl =
  process.env.AUTO_UPDATE_S3_OMIT_ACL === "true" ||
  (process.env.AUTO_UPDATE_S3_OMIT_ACL !== "false" && Boolean(s3Endpoint));

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
              accessKeyId: s3AccessKeyId,
              bucket: s3Bucket,
              endpoint: s3Endpoint,
              folder: s3Folder,
              omitAcl: shouldOmitAcl,
              public: !shouldOmitAcl,
              region: s3Region,
              s3ForcePathStyle,
              secretAccessKey: s3SecretAccessKey,
              sessionToken: s3SessionToken,
            },
          },
        ]
      : [],
};

export default config;
