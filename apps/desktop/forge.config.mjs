import { getAutoUpdateBaseUrl, getPublisherDiagnostics, getPublisherEnv } from "./scripts/env.mjs";
import path from "node:path";

const autoUpdateBaseUrl = getAutoUpdateBaseUrl();
const requirePublish = process.env.DESKTOP_FORGE_COMMAND === "publish";
const publisherEnv = getPublisherEnv({
  requirePublish,
});
const publisherDiagnostics = getPublisherDiagnostics({
  requirePublish,
});
const s3Bucket = publisherEnv.bucket;
const s3Folder = publisherEnv.folder;
const s3Region = publisherEnv.region;
const s3AccessKeyId = publisherEnv.accessKeyId;
const s3SecretAccessKey = publisherEnv.secretAccessKey;
const s3SessionToken = publisherEnv.sessionToken;
const s3Endpoint = publisherEnv.endpoint;
const s3ForcePathStyle = publisherEnv.s3ForcePathStyle;
const desktopIconPath = path.resolve("assets", "desktop.icns");
const dmgBackgroundPath = path.resolve("assets", "dmg-background.png");
const appleSigningIdentity = process.env.APPLE_SIGNING_IDENTITY?.trim();
const appleId = process.env.APPLE_ID?.trim();
const appleAppSpecificPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD?.trim();
const appleTeamId = process.env.APPLE_TEAM_ID?.trim();
const shouldSignDarwin = Boolean(appleSigningIdentity);
const shouldNotarizeDarwin = Boolean(
  appleSigningIdentity && appleId && appleAppSpecificPassword && appleTeamId,
);
const shouldOmitAcl =
  process.env.AUTO_UPDATE_S3_OMIT_ACL === "true" ||
  (process.env.AUTO_UPDATE_S3_OMIT_ACL !== "false" && Boolean(s3Endpoint));

console.log(
  "[desktop-release] forge-config",
  JSON.stringify(
    {
      autoUpdateBaseUrl,
      bucket: publisherDiagnostics.bucket,
      command: process.env.DESKTOP_FORGE_COMMAND ?? "unknown",
      endpoint: publisherDiagnostics.endpoint,
      folder: publisherDiagnostics.folder,
      notarizeDarwin: shouldNotarizeDarwin,
      publisherTargets: publisherDiagnostics.publisherTargets,
      requirePublish: publisherDiagnostics.requirePublish,
      signDarwin: shouldSignDarwin,
      shouldPublish: publisherDiagnostics.shouldPublish,
    },
    null,
    2,
  ),
);

/** @type {import("@electron-forge/shared-types").ForgeConfig} */
const config = {
  hooks: {
    async preMake() {
      console.log("[desktop-release] START forge make phase");
    },
    async postMake(_forgeConfig, makeResults) {
      console.log("[desktop-release] postMake results");

      for (const result of makeResults) {
        console.log(
          "[desktop-release] artifact-batch",
          JSON.stringify(
            {
              arch: result.arch,
              artifacts: result.artifacts,
              platform: result.platform,
            },
            null,
            2,
          ),
        );
      }

      return makeResults;
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
      config: (arch) => ({
        macUpdateManifestBaseUrl: `${autoUpdateBaseUrl}/darwin/${arch}`,
      }),
    },
    {
      name: "@electron-forge/maker-dmg",
      platforms: ["darwin"],
      config: (arch) => ({
        background: dmgBackgroundPath,
        contents: [
          {
            path: "/Applications",
            type: "link",
            x: 505,
            y: 318,
          },
          {
            path: path.resolve("out", `desktop-darwin-${arch}`, "desktop.app"),
            type: "position",
            x: 180,
            y: 318,
          },
        ],
        icon: desktopIconPath,
        iconSize: 104,
        name: "desktop",
        overwrite: true,
        window: {
          size: {
            height: 498,
            width: 658,
          },
        },
      }),
    },
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: (_arch) => ({
        authors: "Next Electron Turborepo",
        description: "Electron shell for the shared Next.js application",
        name: "NextElectronTurborepo",
      }),
    },
  ],
  packagerConfig: {
    asar: true,
    extraResource: [".bundle/web", ".bundle/runtime-config.json"],
    icon: desktopIconPath,
    name: "desktop",
    osxNotarize: shouldNotarizeDarwin
      ? {
          appleId,
          appleIdPassword: appleAppSpecificPassword,
          teamId: appleTeamId,
        }
      : undefined,
    osxSign: shouldSignDarwin
      ? {
          identity: appleSigningIdentity,
          optionsForFile: () => ({
            hardenedRuntime: true,
          }),
        }
      : undefined,
    prune: true,
    ignore: [
      /^\/\.cursor($|\/)/,
      /^\/\.turbo($|\/)/,
      /^\/\.electron\/renderer($|\/)/,
      /^\/electron\.vite\.config\.ts$/,
      /^\/forge\.config\.mjs$/,
      /^\/\.bundle($|\/)/,
      /^\/coverage($|\/)/,
      /^\/dist($|\/)/,
      /^\/out($|\/)/,
      /^\/scripts($|\/)/,
      /^\/src($|\/)/,
      /^\/tests($|\/)/,
      /^\/tsconfig.*$/,
      /^\/node_modules($|\/)/,
    ],
  },
  publishers: publisherEnv.shouldPublish
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
