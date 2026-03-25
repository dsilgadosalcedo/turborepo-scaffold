import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const roots = process.argv.slice(2);

if (roots.length === 0) {
  console.error("Usage: bun run scripts/run-isolated-tests.mjs <path> [<path>...]");
  process.exit(1);
}

const cwd = process.cwd();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const preloadPath = path.relative(cwd, path.resolve(scriptDir, "../tests/setup.browser.ts"));
const testFiles = [
  ...new Set(roots.flatMap((root) => collectTestFiles(path.resolve(cwd, root)))),
].sort();

if (testFiles.length === 0) {
  console.log(`No test files found under ${roots.join(", ")}.`);
  process.exit(0);
}

for (const testFile of testFiles) {
  const relativePath = path.relative(cwd, testFile);
  console.log(`\n==> ${relativePath}`);

  const subprocess = Bun.spawn({
    cmd: ["bun", "test", "--preload", preloadPath, "--pass-with-no-tests", relativePath],
    cwd,
    stderr: "inherit",
    stdout: "inherit",
  });

  const exitCode = await subprocess.exited;

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

function collectTestFiles(root) {
  try {
    const stats = statSync(root);

    if (stats.isFile()) {
      return isTestFile(root) ? [root] : [];
    }

    return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(root, entry.name);

      if (entry.isDirectory()) {
        return collectTestFiles(fullPath);
      }

      return isTestFile(fullPath) ? [fullPath] : [];
    });
  } catch {
    return [];
  }
}

function isTestFile(filePath) {
  return /\.(test|spec)\.(c|m)?[jt]sx?$/u.test(filePath);
}
