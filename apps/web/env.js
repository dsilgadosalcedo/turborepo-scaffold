import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    MARKETING_ORIGIN: z.url(),
  },
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
