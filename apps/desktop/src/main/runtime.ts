import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export function getStandaloneServerEntry(rootDir: string): string | null {
  const candidates = [
    path.join(rootDir, "apps", "web", "server.js"),
    path.join(rootDir, "server.js"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function readAutoUpdateBaseUrl(runtimeConfigPath: string) {
  if (!existsSync(runtimeConfigPath)) {
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

export function supportsAutoUpdates(platform: NodeJS.Platform = process.platform) {
  return platform === "darwin" || platform === "win32";
}

type UpdateFeedUrlOptions = {
  arch?: string;
  isPackaged: boolean;
  platform?: NodeJS.Platform;
  runtimeConfigPath: string;
};

export function getUpdateFeedUrl({
  arch = process.arch,
  isPackaged,
  platform = process.platform,
  runtimeConfigPath,
}: UpdateFeedUrlOptions) {
  if (!isPackaged) {
    return null;
  }

  const baseUrl = readAutoUpdateBaseUrl(runtimeConfigPath);

  if (!baseUrl || !supportsAutoUpdates(platform)) {
    return null;
  }

  return `${baseUrl}/${platform}/${arch}`;
}
