import test from "node:test";
import assert from "node:assert/strict";
import { morningPriority } from "../src/muse/morningBriefing.ts";

test("morning briefing uses 07:30 Kurdistan time and prioritizes today's deadline", () => {
  const base = { kind: "deadline", done: false, createdAt: "2026-11-14T00:00:00Z" };
  const tasks = [
    { ...base, id: "far", due: "2026-11-20", important: true },
    { ...base, id: "today", due: "2026-11-15", important: false },
  ];
  assert.equal(morningPriority(tasks, new Date("2026-11-15T04:29:59Z")), undefined);
  assert.equal(morningPriority(tasks, new Date("2026-11-15T04:30:00Z"))?.id, "today");
  assert.equal(morningPriority([tasks[0]], new Date("2026-11-15T04:30:00Z")), undefined);
});
