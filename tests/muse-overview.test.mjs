import test from "node:test";
import assert from "node:assert/strict";
import { dailyOverview } from "../src/muse/dailyOverview.ts";
const task = (id, due, extra = {}) => ({ id, due, done: false, important: false, kind: "task", ...extra });
test("overview uses Kurdistan midnight, limits three, and never mutates tasks", () => {
  const tasks = [task("later", "2026-11-14"), task("today", "2026-11-10"), task("old", "2026-11-09", { kind: "event" }), task("goal", "2026-11-13", { kind: "goal" }), task("extra", "2026-11-12"), task("done", "2026-11-08", { done: true }), task("undated", null)];
  const before = JSON.stringify(tasks);
  const result = dailyOverview(tasks, new Date("2026-11-09T21:01:00Z"));
  assert.equal(result.today, "2026-11-10");
  assert.equal(result.total, 4);
  assert.deepEqual(result.items.map(x => [x.task.id, x.reason]), [["old", "review"], ["today", "today"], ["extra", "upcoming"]]);
  assert.equal(JSON.stringify(tasks), before);
});
test("overview handles year rollover and an empty workspace honestly", () => {
  assert.equal(dailyOverview([task("goal", "2027-01-02", {kind:"goal"}), task("far", "2027-01-03")], new Date("2026-12-30T10:00:00Z")).total, 1);
  assert.deepEqual(dailyOverview([], new Date("2026-11-10T10:00:00Z")).items, []);
});
