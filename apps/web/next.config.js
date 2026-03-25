import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(currentDir, "../../"),
  transpilePackages: ["@repo/ui", "@t3-oss/env-nextjs", "@t3-oss/env-core"],
  async rewrites() {
    return [
      {
        source: "/download",
        destination: `${env.MARKETING_ORIGIN}/download`,
      },
    ];
  },
};

export default nextConfig;
