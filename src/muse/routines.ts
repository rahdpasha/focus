import {
  createOuting,
  localDate,
  wallToInstant,
  type Workspace,
} from "./domain.ts";
export type Routine = Workspace["routines"][number];
export function occurrenceKey(routineId: string, date: string) {
  return `${routineId}:${date}`;
}
export function nextDate(date: string) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + 86400000)
    .toISOString()
    .slice(0, 10);
}
// Occurrences use a Baghdad calendar date, never the device's UTC date.
// Only today's departures are surfaced: reopening after a holiday does not flood the user.
export function todayRoutines(state: Workspace, now = new Date()) {
  const date = localDate(now, state.profile.timezone);
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return state.routines
    .filter((r) => r.enabled && r.days.includes(weekday))
    .map((routine) => {
      const key = occurrenceKey(routine.id, date);
      const occurrence = state.routineOccurrences.find((o) => o.key === key);
      const scheduledAt = wallToInstant(
        `${date}T${routine.departureTime}`,
        state.profile.timezone,
      );
      const dueAt = occurrence?.snoozedUntil ?? scheduledAt;
      return {
        routine,
        key,
        date,
        occurrence,
        dueAt,
        due: dueAt <= now.toISOString(),
      };
    })
    .filter((o) => !o.occurrence || o.occurrence.status === "snoozed")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}
export function respondToRoutine(
  state: Workspace,
  routineId: string,
  action: "start" | "skip" | "snooze",
  now = new Date(),
): Workspace {
  const due = todayRoutines(state, now).find((o) => o.routine.id === routineId);
  if (!due)
    throw Error(
      "This routine occurrence has already been handled or is not scheduled today.",
    );
  const { routine, key, date } = due;
  const records = state.routineOccurrences
    .filter((o) => o.key !== key)
    .slice(-499);
  const record: Workspace["routineOccurrences"][number] = {
    key,
    routineId,
    date,
    status:
      action === "start"
        ? "started"
        : action === "skip"
          ? "skipped"
          : "snoozed",
    snoozedUntil:
      action === "snooze"
        ? new Date(now.getTime() + 15 * 60000).toISOString()
        : null,
    outingId: null,
  };
  if (action !== "start")
    return { ...state, routineOccurrences: [...records, record] };
  if (
    state.outings.some((o) =>
      ["preparing", "out", "returning"].includes(o.state),
    )
  )
    throw Error("Finish or skip your current outing first.");
  const template = state.templates.find((t) => t.id === routine.templateId);
  if (!template) throw Error("Choose an existing checklist for this routine.");
  if (state.outings.length >= 200)
    throw Error("Outing history is full. Export and remove old outings first.");
  const outing = createOuting(template, now.toISOString());
  outing.name = routine.name;
  outing.occurrenceKey = key;
  // Equal/earlier return time explicitly means the following calendar day.
  const returnDate =
    routine.returnTime <= routine.departureTime ? nextDate(date) : date;
  outing.returnReminderAt = wallToInstant(
    `${returnDate}T${routine.returnTime}`,
    state.profile.timezone,
  );
  record.outingId = outing.id;
  return {
    ...state,
    routineOccurrences: [...records, record],
    outings: [outing, ...state.outings],
  };
}
