import { z } from "zod";

export const linkSchema = z.object({
  title: z.string().min(1).max(100),
  url: z.url(),
});

export type LinkValues = z.infer<typeof linkSchema>;
