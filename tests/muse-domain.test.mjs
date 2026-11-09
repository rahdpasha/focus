import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  createOuting,
  startOuting,
  finishOuting,
  localDate,
  wallToInstant,
} from "../src/muse/domain.ts";
test("Muse snapshots templates and never assumes return", () => {
  const t = initialState().templates[0],
    o = createOuting(t);
  t.items[0] = "Changed";
  assert.equal(o.items[0].name, "Phone");
  assert.throws(() => startOuting(o));
  o.items = o.items.map((i, n) => ({
    ...i,
    departure: n === 0 ? "ready" : "not-taking",
  }));
  const active = startOuting(o);
  assert.ok(active.items.every((i) => i.returned === "unanswered"));
  active.state = "returning";
  assert.throws(() => finishOuting(active));
  active.items[0].returned = "missing";
  assert.equal(finishOuting(active).items[0].returned, "missing");
});
test("Muse resolves Baghdad dates independently of host timezone", () => {
  assert.equal(localDate(new Date("2026-11-08T22:00:00Z")), "2026-11-09");
  assert.equal(wallToInstant("2026-11-09T07:30"), "2026-11-09T04:30:00.000Z");
});
