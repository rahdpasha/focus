import { StateSchema, type Workspace } from "./domain.ts";
export interface MuseEnvelope {
  state: Workspace;
  revision: number;
  dirty: boolean;
  mutationId: string;
}
export const museStorageKey = (userId: string | null) =>
  `focus:muse:v1:${userId ?? "local"}`;
export function readMuseCache(userId: string | null): MuseEnvelope | null {
  const raw = localStorage.getItem(museStorageKey(userId));
  if (!raw) return null;
  const saved = JSON.parse(raw) as MuseEnvelope;
  if (
    !Number.isInteger(saved.revision) ||
    saved.revision < 0 ||
    typeof saved.dirty !== "boolean" ||
    typeof saved.mutationId !== "string"
  )
    throw Error("Invalid Muse cache");
  return { ...saved, state: StateSchema.parse(saved.state) };
}
export function writeMuseCache(userId: string | null, value: MuseEnvelope) {
  localStorage.setItem(museStorageKey(userId), JSON.stringify(value));
}
