import test from "node:test";
import assert from "node:assert/strict";

import {
  buildReleaseIndex,
  compareSemverDesc,
  filterDarwinManifest,
  filterWindowsManifest,
  parseSemver,
} from "./prune-r2-releases.mjs";

test("compareSemverDesc sorts stable releases ahead of prereleases", () => {
  const versions = ["1.2.3-beta.2", "1.2.4", "1.2.3", "1.2.3-beta.10", "1.2.3-beta.1"];
  const sorted = versions
    .map((version) => parseSemver(version))
    .sort(compareSemverDesc)
    .map((version) => version.raw);

  assert.deepEqual(sorted, [
    "1.2.4",
    "1.2.3",
    "1.2.3-beta.10",
    "1.2.3-beta.2",
    "1.2.3-beta.1",
  ]);
});

test("buildReleaseIndex groups Windows prerelease packages with canonical semver", () => {
  const { releases } = buildReleaseIndex([
    "downloads/win32/x64/NextElectronTurborepo-1.2.3-beta.1 Setup.exe",
    "downloads/win32/x64/NextElectronTurborepo-1.2.3-beta1-full.nupkg",
    "downloads/darwin/arm64/desktop-darwin-arm64-1.2.3-beta.1.zip",
  ], "downloads/");

  assert.deepEqual(Array.from(releases.keys()), ["1.2.3-beta.1"]);
  assert.deepEqual(
    Array.from(releases.get("1.2.3-beta.1").windowsPackageBaseNames),
    ["NextElectronTurborepo-1.2.3-beta1-full.nupkg"],
  );
});

test("buildReleaseIndex fails fast on ambiguous alias collisions", () => {
  assert.throws(
    () =>
      buildReleaseIndex(
        [
          "downloads/win32/x64/NextElectronTurborepo-1.2.3-beta1 Setup.exe",
          "downloads/darwin/arm64/desktop-darwin-arm64-1.2.3-beta.1.zip",
        ],
        "downloads/",
      ),
    /Ambiguous release alias/u,
  );
});

test("filterDarwinManifest keeps only retained versions and resets currentRelease", () => {
  const manifest = {
    currentRelease: "1.0.0",
    releases: [
      { version: "1.0.0", updateTo: { url: "https://example.test/1.0.0.zip" } },
      { version: "1.1.0", updateTo: { url: "https://example.test/1.1.0.zip" } },
      { version: "1.2.0-beta.1", updateTo: { url: "https://example.test/1.2.0-beta.1.zip" } },
    ],
  };
  const result = filterDarwinManifest(JSON.stringify(manifest), new Set(["1.1.0", "1.2.0-beta.1"]));

  assert.equal(result.delete, false);

  const parsed = JSON.parse(result.body);

  assert.equal(parsed.currentRelease, "1.2.0-beta.1");
  assert.deepEqual(
    parsed.releases.map((release) => release.version),
    ["1.1.0", "1.2.0-beta.1"],
  );
});

test("filterWindowsManifest keeps only retained package lines", () => {
  const content = [
    "hash-a desktop-1.0.0-full.nupkg 123",
    "hash-b desktop-1.1.0-full.nupkg 456",
    "hash-c desktop-1.2.0-beta1-full.nupkg 789",
  ].join("\n");
  const result = filterWindowsManifest(
    content,
    new Set(["desktop-1.1.0-full.nupkg", "desktop-1.2.0-beta1-full.nupkg"]),
  );

  assert.equal(result.delete, false);
  assert.equal(
    result.body,
    [
      "hash-b desktop-1.1.0-full.nupkg 456",
      "hash-c desktop-1.2.0-beta1-full.nupkg 789",
      "",
    ].join("\n"),
  );
});

test("filterWindowsManifest deletes manifest when no retained packages remain", () => {
  const result = filterWindowsManifest(
    "hash-a desktop-1.0.0-full.nupkg 123\n",
    new Set(["desktop-1.1.0-full.nupkg"]),
  );

  assert.deepEqual(result, { delete: true });
});
