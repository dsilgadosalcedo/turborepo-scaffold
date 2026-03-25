import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

export function findServerEntry(rootDir: string): string | null {
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current)) {
      const fullPath = path.join(current, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry === "server.js") {
        return fullPath;
      }
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
