import { z } from "zod";

export const groupSchema = z.object({
  title: z.string().min(1).max(100),
});

export type GroupValues = z.infer<typeof groupSchema>;
