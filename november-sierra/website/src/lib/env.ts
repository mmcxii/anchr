import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const envSchema = createEnv({
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

    CONTACT_EMAIL_FROM: process.env.CONTACT_EMAIL_FROM,
    CONTACT_EMAIL_TO: process.env.CONTACT_EMAIL_TO,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  server: {
    CONTACT_EMAIL_FROM: z.string().email(),
    CONTACT_EMAIL_TO: z.string().email(),
    RESEND_API_KEY: z.string().min(1),
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
