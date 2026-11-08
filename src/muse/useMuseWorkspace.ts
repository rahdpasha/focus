import { useEffect, useRef, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { initialState, StateSchema, type Workspace } from "./domain";
import {
  readMuseCache,
  writeMuseCache,
  museStorageKey,
  type MuseEnvelope,
} from "./storage";
export type MuseSync =
  | "loading"
  | "local"
  | "synced"
  | "pending"
  | "conflict"
  | "setup"
  | "error";
export function useMuseWorkspace(userId: string | null, displayName?: string) {
  const initial = () => {
    const s = initialState();
    s.profile.name = displayName || "You";
    return s;
  };
  const [data, setData] = useState<Workspace>(initial),
    [status, setStatus] = useState<MuseSync>("loading"),
    [error, setError] = useState(""),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false);
  const value = useRef<MuseEnvelope>({
    state: initial(),
    revision: 0,
    dirty: false,
    mutationId: crypto.randomUUID(),
  });
  const mounted = useRef(false),
    inFlight = useRef(false),
    blocked = useRef(false);
  function update(next: MuseEnvelope) {
    value.current = next;
    if (mounted.current) setData(next.state);
  }
  async function sync() {
    if (!mounted.current || inFlight.current || blocked.current) return;
    if (!supabase || !userId) {
      setStatus("local");
      return;
    }
    if (!navigator.onLine) {
      setStatus("pending");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const { data: row, error: fetchError } = await supabase
        .from("muse_workspaces")
        .select("state,revision,last_mutation_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!mounted.current) return;
      if (fetchError) throw fetchError;
      const local = value.current;
      if (local.dirty) {
        if (row?.last_mutation_id === local.mutationId) {
          const acknowledged = {
            ...local,
            revision: row.revision,
            dirty: false,
          };
          writeMuseCache(userId, acknowledged);
          update(acknowledged);
        } else {
          if ((row?.revision ?? 0) !== local.revision) {
            blocked.current = true;
            setStatus("conflict");
            setError(
              "Muse changed on another device. Export this device’s data before loading the cloud version.",
            );
            return;
          }
          const { data: revision, error: saveError } = await supabase.rpc(
            "muse_save_workspace",
            {
              p_state: local.state,
              p_expected_revision: local.revision,
              p_mutation_id: local.mutationId,
            },
          );
          if (!mounted.current) return;
          if (saveError) throw saveError;
          const acknowledged = {
            ...local,
            revision: Number(revision),
            dirty: false,
          };
          writeMuseCache(userId, acknowledged);
          update(acknowledged);
        }
      } else if (row) {
        const fresh = {
          state: StateSchema.parse(row.state),
          revision: row.revision,
          dirty: false,
          mutationId: crypto.randomUUID(),
        };
        writeMuseCache(userId, fresh);
        update(fresh);
      }
      setStatus("synced");
      setError("");
    } catch (e) {
      if (!mounted.current) return;
      const err = e as { code?: string; message?: string };
      if (err.code === "40001") {
        blocked.current = true;
        setStatus("conflict");
        setError(
          "Muse changed on another device. Your local changes are preserved. Export them before reloading cloud data.",
        );
      } else if (
        ["42P01", "PGRST205", "PGRST202", "42883"].includes(err.code ?? "")
      ) {
        setStatus("setup");
        setError(
          "Muse is saved on this device. Apply the included Muse database migration to enable cloud sync.",
        );
      } else {
        setStatus("pending");
        setError(
          "Cloud sync is unavailable. Your changes remain saved on this device; retry when connected.",
        );
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    try {
      const cached = readMuseCache(userId);
      if (cached) update(cached);
      // Hydrate the external device cache before enabling edits and cloud sync.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
      void sync();
    } catch {
      blocked.current = true;
      setError(
        "The local Muse data could not be read. It was not overwritten. Export the raw backup before recovering.",
      );
      setStatus("error");
    }
    const reconnect = () => void sync();
    const changed = (event: StorageEvent) => {
      if (event.key === museStorageKey(userId)) {
        blocked.current = true;
        setStatus("conflict");
        setError(
          "Muse was updated in another tab. Reload the app to use its latest saved version.",
        );
      }
    };
    window.addEventListener("online", reconnect);
    window.addEventListener("focus", reconnect);
    window.addEventListener("storage", changed);
    return () => {
      mounted.current = false;
      window.removeEventListener("online", reconnect);
      window.removeEventListener("focus", reconnect);
      window.removeEventListener("storage", changed);
    };
    // User changes remount the authenticated application, including this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  async function save(next: Workspace) {
    if (!ready || inFlight.current || blocked.current) return false;
    try {
      const parsed = StateSchema.parse(next),
        nextValue = {
          ...value.current,
          state: parsed,
          dirty: true,
          mutationId: crypto.randomUUID(),
        };
      writeMuseCache(userId, nextValue);
      update(nextValue);
      setStatus("pending");
      await sync();
      return true;
    } catch {
      setError(
        "Could not save Muse on this device. Check storage availability; your previous data is unchanged.",
      );
      setStatus("error");
      return false;
    }
  }
  async function useCloud() {
    if (!supabase || !userId) return;
    setBusy(true);
    try {
      const { data: row, error: err } = await supabase
        .from("muse_workspaces")
        .select("state,revision")
        .eq("user_id", userId)
        .maybeSingle();
      if (err) throw err;
      const fresh = {
        state: row ? StateSchema.parse(row.state) : initial(),
        revision: row?.revision ?? 0,
        dirty: false,
        mutationId: crypto.randomUUID(),
      };
      writeMuseCache(userId, fresh);
      update(fresh);
      blocked.current = false;
      setReady(true);
      setError("");
      setStatus("synced");
    } catch {
      setError("Cloud data could not be loaded. Nothing was replaced.");
    } finally {
      setBusy(false);
    }
  }
  return {
    data,
    ready,
    busy,
    status,
    error,
    save,
    retry: sync,
    useCloud,
    rawBackup: () => localStorage.getItem(museStorageKey(userId)) ?? "",
  };
}
