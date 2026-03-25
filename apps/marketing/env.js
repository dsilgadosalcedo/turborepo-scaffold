import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    AUTO_UPDATE_BASE_URL: z.url(),
  },
  client: {
    NEXT_PUBLIC_PRODUCT_WEB_URL: z.url(),
  },
  runtimeEnv: {
    AUTO_UPDATE_BASE_URL: process.env.AUTO_UPDATE_BASE_URL,
    NEXT_PUBLIC_PRODUCT_WEB_URL: process.env.NEXT_PUBLIC_PRODUCT_WEB_URL,
  },
  emptyStringAsUndefined: true,
});
