import { z } from "zod";

export const nodeReleaseSchema = z.object({
  version: z.string().regex(/^v\d{1,3}\.\d{1,4}\.\d{1,4}$/),
  date: z.string().date(),
  security: z.boolean(),
});

export type NodeRelease = z.infer<typeof nodeReleaseSchema>;

export function isRecentRelease(date: string, now: Date) {
  const today = Date.parse(now.toISOString().slice(0, 10));
  const age = today - Date.parse(date);
  return age >= 0 && age < 7 * 86400000;
}
