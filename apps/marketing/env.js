import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_PRODUCT_WEB_URL: z.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_PRODUCT_WEB_URL: process.env.NEXT_PUBLIC_PRODUCT_WEB_URL,
  },
  emptyStringAsUndefined: true,
});
