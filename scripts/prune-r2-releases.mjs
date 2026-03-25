import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { pathToFileURL } from "node:url";

function toPrefix(value) {
  const trimmed = value.trim().replace(/^\/+/u, "").replace(/\/+$/u, "");
  return trimmed ? `${trimmed}/` : "";
}

export function parseSemver(input) {
  const match = input.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+.*)?$/u,
  );

  if (!match) {
    return null;
  }

  const prerelease = match[4] ? match[4].split(".") : [];

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    prerelease,
    raw: input,
  };
}

function comparePrerelease(left, right) {
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = left[index];
    const rightPart = right[index];

    if (leftPart === undefined) {
      return -1;
    }

    if (rightPart === undefined) {
      return 1;
    }

    const leftIsNumeric = /^\d+$/u.test(leftPart);
    const rightIsNumeric = /^\d+$/u.test(rightPart);

    if (leftIsNumeric && rightIsNumeric) {
      const diff = Number.parseInt(leftPart, 10) - Number.parseInt(rightPart, 10);

      if (diff !== 0) {
        return diff > 0 ? 1 : -1;
      }

      continue;
    }

    if (leftIsNumeric && !rightIsNumeric) {
      return -1;
    }

    if (!leftIsNumeric && rightIsNumeric) {
      return 1;
    }

    if (leftPart === rightPart) {
      continue;
    }

    return leftPart > rightPart ? 1 : -1;
  }

  return 0;
}

export function compareSemverDesc(left, right) {
  if (left.major !== right.major) {
    return right.major - left.major;
  }

  if (left.minor !== right.minor) {
    return right.minor - left.minor;
  }

  if (left.patch !== right.patch) {
    return right.patch - left.patch;
  }

  const leftHasPrerelease = left.prerelease.length > 0;
  const rightHasPrerelease = right.prerelease.length > 0;

  if (!leftHasPrerelease && rightHasPrerelease) {
    return -1;
  }

  if (leftHasPrerelease && !rightHasPrerelease) {
    return 1;
  }

  return -comparePrerelease(left.prerelease, right.prerelease);
}

export function extractVersionFromKey(key) {
  const fileName = key.split("/").pop() ?? key;
  let normalized = fileName;

  for (const suffix of [
    ".blockmap",
    ".nupkg",
    ".zip",
    ".dmg",
    ".exe",
    ".AppImage",
    ".rpm",
    ".deb",
  ]) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length);
      break;
    }
  }

  for (const suffix of [" Setup", "-full", "-delta"]) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length);
    }
  }

  const match = normalized.match(/(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/u);
  return match?.[1] ?? null;
}

function canonicalizeVersionAlias(parsed) {
  const base = `${parsed.major}.${parsed.minor}.${parsed.patch}`;

  if (parsed.prerelease.length === 0) {
    return base;
  }

  return `${base}-${parsed.prerelease.join("")}`;
}

function isSharedManifestKey(key) {
  return key.endsWith("/RELEASES") || key.endsWith("/RELEASES.json");
}

function isNuGetPackageKey(key) {
  return key.endsWith(".nupkg");
}

function isAuthoritativeVersionKey(key) {
  return !isNuGetPackageKey(key);
}

function uniqueSortedVersions(versions) {
  return Array.from(new Set(versions)).sort((left, right) => {
    const leftParsed = parseSemver(left);
    const rightParsed = parseSemver(right);

    if (!leftParsed || !rightParsed) {
      return left.localeCompare(right);
    }

    return compareSemverDesc(leftParsed, rightParsed);
  });
}

function resolveCanonicalVersion(alias, versionRecords) {
  const authoritativeVersions = uniqueSortedVersions(
    versionRecords.filter(({ authoritative }) => authoritative).map(({ version }) => version),
  );

  if (authoritativeVersions.length > 1) {
    throw new Error(
      `Ambiguous release alias "${alias}" matches multiple published versions: ${authoritativeVersions.join(", ")}.`,
    );
  }

  if (authoritativeVersions.length === 1) {
    return authoritativeVersions[0];
  }

  const fallbackVersions = uniqueSortedVersions(versionRecords.map(({ version }) => version));

  if (fallbackVersions.length > 1) {
    throw new Error(
      `Ambiguous release alias "${alias}" only appears in Windows package names: ${fallbackVersions.join(", ")}.`,
    );
  }

  return fallbackVersions[0];
}

function getManifestInfo(key, prefix) {
  const relative = prefix ? key.slice(prefix.length) : key;
  const segments = relative.split("/");

  if (segments.length < 3) {
    return null;
  }

  return {
    arch: segments[1],
    platform: segments[0],
  };
}

export function buildReleaseIndex(keys, prefix = "") {
  const releasesByAlias = new Map();
  const sharedManifestKeys = [];

  for (const key of keys) {
    if (isSharedManifestKey(key)) {
      sharedManifestKeys.push(key);
      continue;
    }

    const version = extractVersionFromKey(key);

    if (!version) {
      continue;
    }

    const parsed = parseSemver(version);

    if (!parsed) {
      continue;
    }

    const alias = canonicalizeVersionAlias(parsed);
    const existing = releasesByAlias.get(alias) ?? [];

    existing.push({
      authoritative: isAuthoritativeVersionKey(key),
      key,
      parsed,
      version,
    });
    releasesByAlias.set(alias, existing);
  }

  const releases = new Map();

  for (const [alias, versionRecords] of releasesByAlias.entries()) {
    const canonicalVersion = resolveCanonicalVersion(alias, versionRecords);
    const parsed = parseSemver(canonicalVersion);

    if (!parsed) {
      throw new Error(`Failed to parse canonical version "${canonicalVersion}".`);
    }

    const release = {
      alias,
      keys: new Set(versionRecords.map(({ key }) => key)),
      manifestVersions: new Set(versionRecords.map(({ version }) => version)),
      parsed,
      version: canonicalVersion,
      windowsPackageBaseNames: new Set(),
      windowsReleaseManifestKeys: new Set(),
    };

    for (const { key } of versionRecords) {
      if (isNuGetPackageKey(key)) {
        release.windowsPackageBaseNames.add(key.split("/").pop() ?? key);
        const manifestInfo = getManifestInfo(key, prefix);

        if (manifestInfo?.platform === "win32") {
          const manifestSuffix = `${manifestInfo.platform}/${manifestInfo.arch}/RELEASES`;
          release.windowsReleaseManifestKeys.add(`${prefix}${manifestSuffix}`);
        }
      }
    }

    releases.set(release.version, release);
  }

  return {
    releases,
    sharedManifestKeys,
  };
}

export function filterDarwinManifest(content, keptVersions) {
  const parsed = JSON.parse(content);
  const releases = Array.isArray(parsed.releases) ? parsed.releases : [];
  const nextReleases = releases.filter((release) => keptVersions.has(release.version));

  if (nextReleases.length === 0) {
    return { delete: true };
  }

  const currentRelease =
    uniqueSortedVersions(nextReleases.map((release) => release.version))[0] ?? "";

  return {
    body: JSON.stringify(
      {
        ...parsed,
        currentRelease,
        releases: nextReleases,
      },
      null,
      2,
    ),
    contentType: "application/json",
    delete: false,
  };
}

function extractWindowsManifestPackageName(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(/\s+/u);

  return parts[1] ?? null;
}

export function filterWindowsManifest(content, keptPackageBaseNames) {
  const lines = content.split(/\r?\n/u);
  const keptLines = lines.filter((line) => {
    const packageName = extractWindowsManifestPackageName(line);

    if (!packageName) {
      return false;
    }

    return keptPackageBaseNames.has(packageName);
  });

  if (keptLines.length === 0) {
    return { delete: true };
  }

  return {
    body: `${keptLines.join("\n")}\n`,
    contentType: "text/plain; charset=utf-8",
    delete: false,
  };
}

function collectKeptWindowsPackages(keptReleases) {
  const packagesByManifestKey = new Map();

  for (const release of keptReleases) {
    for (const manifestKey of release.windowsReleaseManifestKeys) {
      const existing = packagesByManifestKey.get(manifestKey) ?? new Set();

      for (const packageName of release.windowsPackageBaseNames) {
        existing.add(packageName);
      }

      packagesByManifestKey.set(manifestKey, existing);
    }
  }

  return packagesByManifestKey;
}

function collectKeptManifestVersions(keptReleases) {
  const versions = new Set();

  for (const release of keptReleases) {
    for (const version of release.manifestVersions) {
      versions.add(version);
    }
  }

  return versions;
}

async function listAllObjects(client, bucket, listPrefix) {
  const objects = [];
  let continuationToken;

  while (true) {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
        Prefix: listPrefix,
      }),
    );

    for (const object of response.Contents ?? []) {
      if (object.Key) {
        objects.push(object.Key);
      }
    }

    if (!response.IsTruncated) {
      break;
    }

    continuationToken = response.NextContinuationToken;
  }

  return objects;
}

async function deleteObjects(client, bucket, keysToDelete) {
  for (let index = 0; index < keysToDelete.length; index += 1000) {
    const chunk = keysToDelete.slice(index, index + 1000);

    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((key) => ({ Key: key })),
          Quiet: false,
        },
      }),
    );
  }
}

async function readObjectText(client, bucket, key) {
  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error(`Object "${key}" has no readable body.`);
  }

  return response.Body.transformToString();
}

async function writeObject(client, bucket, key, body, contentType) {
  await client.send(
    new PutObjectCommand({
      Body: body,
      Bucket: bucket,
      ContentType: contentType,
      Key: key,
    }),
  );
}

async function planManifestActions(client, bucket, sharedManifestKeys, keptReleases, prefix) {
  const keptVersions = collectKeptManifestVersions(keptReleases);
  const keptWindowsPackages = collectKeptWindowsPackages(keptReleases);
  const actions = [];

  for (const key of sharedManifestKeys) {
    const manifestInfo = getManifestInfo(key, prefix);

    if (!manifestInfo) {
      continue;
    }

    const content = await readObjectText(client, bucket, key);

    if (key.endsWith("/RELEASES.json")) {
      const result = filterDarwinManifest(content, keptVersions);

      actions.push({
        ...result,
        key,
      });
      continue;
    }

    if (key.endsWith("/RELEASES")) {
      const packageNames = keptWindowsPackages.get(key) ?? new Set();
      const result = filterWindowsManifest(content, packageNames);

      actions.push({
        ...result,
        key,
      });
    }
  }

  return actions;
}

function createS3Client({
  accessKeyId,
  endpoint,
  forcePathStyle,
  region,
  secretAccessKey,
  sessionToken,
}) {
  return new S3Client({
    credentials: {
      accessKeyId,
      secretAccessKey,
      sessionToken,
    },
    endpoint,
    forcePathStyle,
    region,
  });
}

export async function runCleanup({
  accessKeyId,
  bucket,
  endpoint,
  folder = "",
  forcePathStyle = false,
  keepReleases,
  region = "auto",
  secretAccessKey,
  sessionToken,
}) {
  if (!Number.isInteger(keepReleases) || keepReleases < 1) {
    console.log("Skipping cleanup because AUTO_UPDATE_KEEP_RELEASES is missing or invalid.");
    return;
  }

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing required R2 variables. Required: AUTO_UPDATE_S3_BUCKET, AUTO_UPDATE_S3_ENDPOINT, AUTO_UPDATE_S3_ACCESS_KEY_ID, AUTO_UPDATE_S3_SECRET_ACCESS_KEY.",
    );
  }

  const prefix = toPrefix(folder);
  const client = createS3Client({
    accessKeyId,
    endpoint,
    forcePathStyle,
    region,
    secretAccessKey,
    sessionToken,
  });

  const keys = await listAllObjects(client, bucket, prefix);
  const { releases, sharedManifestKeys } = buildReleaseIndex(keys, prefix);
  const releaseEntries = Array.from(releases.values()).sort((left, right) =>
    compareSemverDesc(left.parsed, right.parsed),
  );
  const keptReleases = releaseEntries.slice(0, keepReleases);
  const deletedReleases = releaseEntries.slice(keepReleases);
  const manifestActions = await planManifestActions(
    client,
    bucket,
    sharedManifestKeys,
    keptReleases,
    prefix,
  );
  const keysToDelete = deletedReleases.flatMap((release) => Array.from(release.keys));
  const manifestKeysToDelete = manifestActions
    .filter((action) => action.delete)
    .map(({ key }) => key);
  const manifestWrites = manifestActions.filter((action) => !action.delete);

  if (
    keysToDelete.length === 0 &&
    manifestWrites.length === 0 &&
    manifestKeysToDelete.length === 0
  ) {
    console.log(
      `No cleanup needed. Found ${releaseEntries.length} versioned releases, keep=${keepReleases}.`,
    );
    return;
  }

  console.log(
    `Keeping versions: ${keptReleases.map(({ version }) => version).join(", ") || "(none)"}`,
  );
  console.log(
    `Deleting versions: ${deletedReleases.map(({ version }) => version).join(", ") || "(none)"}`,
  );

  if (manifestWrites.length > 0) {
    console.log(`Updating ${manifestWrites.length} shared manifest(s).`);
  }

  if (manifestKeysToDelete.length > 0) {
    console.log(`Deleting ${manifestKeysToDelete.length} empty shared manifest(s).`);
  }

  if (keysToDelete.length > 0) {
    console.log(`Deleting ${keysToDelete.length} old artifact(s) from ${bucket}/${prefix}`);
  }

  for (const manifest of manifestWrites) {
    await writeObject(client, bucket, manifest.key, manifest.body, manifest.contentType);
  }

  if (keysToDelete.length > 0 || manifestKeysToDelete.length > 0) {
    await deleteObjects(client, bucket, [...keysToDelete, ...manifestKeysToDelete]);
  }

  console.log("Cleanup complete.");
}

async function main() {
  const keepReleasesRaw = process.env.AUTO_UPDATE_KEEP_RELEASES ?? "";
  const bucket = process.env.AUTO_UPDATE_S3_BUCKET;
  const region = process.env.AUTO_UPDATE_S3_REGION ?? "auto";
  const endpoint = process.env.AUTO_UPDATE_S3_ENDPOINT;
  const accessKeyId = process.env.AUTO_UPDATE_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AUTO_UPDATE_S3_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AUTO_UPDATE_S3_SESSION_TOKEN;
  const forcePathStyle = process.env.AUTO_UPDATE_S3_FORCE_PATH_STYLE === "true";
  const folder = process.env.AUTO_UPDATE_S3_FOLDER ?? "";
  const keepReleases = Number.parseInt(keepReleasesRaw, 10);

  const missing = [
    ["AUTO_UPDATE_KEEP_RELEASES", keepReleasesRaw],
    ["AUTO_UPDATE_S3_BUCKET", bucket],
    ["AUTO_UPDATE_S3_ENDPOINT", endpoint],
    ["AUTO_UPDATE_S3_ACCESS_KEY_ID", accessKeyId],
    ["AUTO_UPDATE_S3_SECRET_ACCESS_KEY", secretAccessKey],
  ].flatMap(([name, value]) => (value ? [] : [name]));

  if (missing.length > 0) {
    throw new Error(`Missing required cleanup environment variables: ${missing.join(", ")}.`);
  }

  if (!Number.isInteger(keepReleases) || keepReleases < 1) {
    throw new Error("AUTO_UPDATE_KEEP_RELEASES must be an integer >= 1.");
  }

  await runCleanup({
    accessKeyId,
    bucket,
    endpoint,
    folder,
    forcePathStyle,
    keepReleases,
    region,
    secretAccessKey,
    sessionToken,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
