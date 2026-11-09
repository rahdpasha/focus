import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  exampleProfilePriorities,
  displayProfilePriorities,
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

import { StateSchema } from "../src/muse/domain.ts";
import { todayRoutines, respondToRoutine } from "../src/muse/routines.ts";
const monday = new Date("2026-11-09T05:00:00Z");
function scheduledState() {
  const state = initialState();
  state.routines = [
    {
      id: "weekly",
      templateId: "university",
      name: "University",
      days: [0, 1, 2, 3, 4],
      departureTime: "08:00",
      returnTime: "15:00",
      enabled: true,
    },
  ];
  return state;
}
test("existing Muse workspaces migrate with no unsolicited routines", () => {
  const state = initialState();
  delete state.routines;
  delete state.routineOccurrences;
  const parsed = StateSchema.parse(state);
  assert.deepEqual(parsed.routines, []);
  assert.deepEqual(parsed.routineOccurrences, []);
});
test("weekly routines use Baghdad day and do not replay missed days", () => {
  const state = scheduledState();
  const earlyMonday = todayRoutines(state, new Date("2026-11-08T22:00:00Z"));
  assert.equal(earlyMonday[0].date, "2026-11-09");
  assert.equal(earlyMonday[0].due, false);
  assert.equal(todayRoutines(state, monday)[0].due, true);
  assert.equal(
    todayRoutines(state, new Date("2026-11-13T06:00:00Z")).length,
    0,
  );
  state.routines[0].enabled = false;
  assert.equal(todayRoutines(state, monday).length, 0);
});
test("routine start is deduplicated, snapshots belongings, and connects return time", () => {
  const state = respondToRoutine(scheduledState(), "weekly", "start", monday);
  const outing = state.outings[0];
  assert.equal(outing.occurrenceKey, "weekly:2026-11-09");
  assert.equal(outing.returnReminderAt, "2026-11-09T12:00:00.000Z");
  assert.equal(state.routineOccurrences[0].outingId, outing.id);
  assert.throws(() => respondToRoutine(state, "weekly", "start", monday));
  state.templates[0].items[0] = "Changed";
  state.routines[0].returnTime = "20:00";
  assert.equal(outing.items[0].name, "Phone");
  assert.equal(outing.returnReminderAt, "2026-11-09T12:00:00.000Z");
  assert.ok(
    outing.items.every(
      (i) => i.departure === "unanswered" && i.returned === "unanswered",
    ),
  );
});
test("skip affects only this date, snooze survives schema round trip", () => {
  let state = respondToRoutine(scheduledState(), "weekly", "snooze", monday);
  state = StateSchema.parse(JSON.parse(JSON.stringify(state)));
  assert.equal(todayRoutines(state, monday)[0].due, false);
  assert.equal(
    todayRoutines(state, new Date("2026-11-09T05:15:00Z"))[0].due,
    true,
  );
  state = respondToRoutine(state, "weekly", "skip", monday);
  assert.equal(todayRoutines(state, monday).length, 0);
  assert.equal(
    todayRoutines(state, new Date("2026-11-10T05:00:00Z")).length,
    1,
  );
});
test("overnight return crosses year boundary without assuming a return", () => {
  const state = scheduledState();
  state.routines[0].departureTime = "23:00";
  state.routines[0].returnTime = "01:00";
  const next = respondToRoutine(
    state,
    "weekly",
    "start",
    new Date("2026-12-31T20:00:00Z"),
  );
  assert.equal(next.outings[0].returnReminderAt, "2026-12-31T22:00:00.000Z");
  assert.equal(next.outings[0].state, "preparing");
});
test("active spontaneous outing blocks a new scheduled outing", () => {
  const state = scheduledState();
  state.outings.push(createOuting(state.templates[0]));
  assert.throws(() => respondToRoutine(state, "weekly", "start", monday));
  assert.equal(state.routineOccurrences.length, 0);
});
test("routine schema rejects invalid clock times and duplicate weekdays", () => {
  const state = scheduledState();
  state.routines[0].departureTime = "25:00";
  assert.equal(StateSchema.safeParse(state).success, false);
  state.routines[0].departureTime = "08:00";
  state.routines[0].days = [1, 1];
  assert.equal(StateSchema.safeParse(state).success, false);
});

test("New Muse profiles use broadly relevant, editable starter examples", () => {
  const profile = initialState().profile;
  assert.equal(profile.name, "You");
  assert.deepEqual(profile.priorities, [
    "Take care of myself",
    "Stay organized",
    "Make progress on my goals",
  ]);
  assert.deepEqual(profile.priorities, [...exampleProfilePriorities]);
  assert.equal(StateSchema.safeParse(initialState()).success, true);
});

test("Legacy student defaults display generically without overwriting personal entries", () => {
  const legacy = [
    "University responsibilities",
    "Build strong engineering fundamentals",
    "Improve my English",
    "Becoming better",
  ];
  const snapshot = [...legacy];
  assert.deepEqual(displayProfilePriorities(legacy), [
    ...exampleProfilePriorities,
    "Becoming better",
  ]);
  assert.deepEqual(legacy, snapshot, "display conversion should not modify saved data");
  const personal = ["My children", "Volunteer in my community", "Train for a marathon"];
  assert.deepEqual(displayProfilePriorities(personal), personal);
  assert.deepEqual(displayProfilePriorities([]), []);
});
