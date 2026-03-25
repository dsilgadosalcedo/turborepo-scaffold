import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const MARKETING_ORIGIN = process.env.MARKETING_ORIGIN ?? "https://turborepo-scaffold.vercel.app";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(currentDir, "../../"),
  transpilePackages: ["@repo/ui"],
  async rewrites() {
    return [
      {
        source: "/download",
        destination: `${MARKETING_ORIGIN}/download`,
      },
    ];
  },
};

export default nextConfig;
