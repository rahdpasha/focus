import test from "node:test";
import assert from "node:assert/strict";
import { selectNodeRelease } from "../api/muse-tech-update.ts";

test("the update filters stale, prerelease, and routine patches from the official index", () => {
  const now = new Date("2026-11-15T15:00:00Z");
  const entries = [
    { version: "v26.0.0-rc.1", date: "2026-11-15", lts: false, security: false },
    { version: "v24.12.1", date: "2026-11-15", lts: "Krypton", security: false },
    { version: "v24.11.2", date: "2026-11-08", lts: "Krypton", security: true },
    { version: "v24.13.0", date: "2026-11-16", lts: "Krypton", security: true },
  ];
  assert.equal(selectNodeRelease(entries, now), null);
  const release = { version: "v24.12.2", date: "2026-11-14", security: true };
  assert.deepEqual(selectNodeRelease([...entries, { ...release, lts: "Krypton" }], now), release);
});
