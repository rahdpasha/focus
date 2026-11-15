import test from "node:test";
import assert from "node:assert/strict";
import { weeklyReview } from "../src/muse/weeklyReview.ts";

test("weekly review rolls over Saturday at 7 PM Kurdistan time", () => {
  assert.equal(weeklyReview(new Date("2026-11-14T15:59:59Z"), [], []).key, "2026-11-07");
  assert.equal(weeklyReview(new Date("2026-11-14T16:00:00Z"), [], []).key, "2026-11-14");
});

test("weekly review uses recorded work and separates still-open dates", () => {
  const now = new Date("2026-11-15T11:00:00Z");
  const tasks = [
    { id: "finished", done: true, completedAt: "2026-11-13T12:00:00Z" },
    { id: "past", done: false, due: "2026-11-13" },
    { id: "next", done: false, due: "2026-11-17" },
  ];
  const sessions = [
    { subjectId: "eng", subjectName: "English", actualDuration: 1200, completed: true, completedAt: "2026-11-13T12:00:00Z" },
    { subjectId: "eng", subjectName: "English", actualDuration: 600, completed: true, completedAt: "2026-11-14T16:00:00Z" },
  ];
  const review = weeklyReview(now, tasks, sessions);
  assert.deepEqual(review.completed.map(item => item.id), ["finished"]);
  assert.deepEqual(review.pastDates.map(item => item.id), ["past"]);
  assert.deepEqual(review.upcoming.map(item => item.id), ["next"]);
  assert.deepEqual(review.subjects, [["eng", { name: "English", seconds: 1200 }]]);
});
