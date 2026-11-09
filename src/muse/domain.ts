import { z } from "zod";
const id = z.string().min(1).max(100);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
  );
const stamp = z.string().datetime();
const text = z.string().trim().min(1).max(300);
export const StateSchema = z.object({
  profile: z.object({
    name: z.string().trim().min(1).max(50),
    timezone: z.literal("Asia/Baghdad"),
    priorities: z.array(text).max(5),
  }),
  tasks: z
    .array(
      z.object({
        id,
        title: text,
        kind: z.enum(["task", "deadline", "event", "goal"]),
        area: z.enum(["university", "engineering", "personal", "english"]),
        due: date.nullable(),
        important: z.boolean(),
        done: z.boolean(),
        createdAt: stamp,
        completedAt: stamp.nullable(),
        reminderAt: stamp.nullable(),
        reminderStatus: z.enum(["pending", "dismissed"]),
      }),
    )
    .max(500),
  memories: z
    .array(
      z.object({
        id,
        text,
        kind: z.enum(["preference", "context"]),
        source: z.literal("user"),
        updatedAt: stamp,
      }),
    )
    .max(100),
  templates: z
    .array(z.object({ id, name: text, items: z.array(text).min(1).max(30) }))
    .max(30),
  routines: z
    .array(
      z.object({
        id,
        templateId: id,
        name: text,
        days: z
          .array(z.number().int().min(0).max(6))
          .min(1)
          .max(7)
          .refine((days) => new Set(days).size === days.length),
        departureTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        returnTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        enabled: z.boolean(),
      }),
    )
    .max(30)
    .default([]),
  routineOccurrences: z
    .array(
      z.object({
        key: id,
        routineId: id,
        date,
        status: z.enum(["snoozed", "skipped", "started"]),
        snoozedUntil: stamp.nullable(),
        outingId: id.nullable(),
      }),
    )
    .max(500)
    .default([]),
  outings: z
    .array(
      z.object({
        id,
        name: text,
        templateId: id.nullable(),
        occurrenceKey: id.nullable().default(null),
        returnReminderAt: stamp.nullable().default(null),
        state: z.enum(["preparing", "out", "returning", "finished", "skipped"]),
        createdAt: stamp,
        startedAt: stamp.nullable(),
        finishedAt: stamp.nullable(),
        items: z
          .array(
            z.object({
              id,
              name: text,
              departure: z.enum(["unanswered", "ready", "not-taking", "na"]),
              returned: z.enum(["unanswered", "have", "missing", "na"]),
            }),
          )
          .max(30),
      }),
    )
    .max(200),
});
export type Workspace = z.infer<typeof StateSchema>;
export type Task = Workspace["tasks"][number];
export type Outing = Workspace["outings"][number];
export type Template = Workspace["templates"][number];
export function initialState(): Workspace {
  return {
    profile: {
      name: "You",
      timezone: "Asia/Baghdad",
      priorities: [
        "University responsibilities",
        "Build strong engineering fundamentals",
        "Improve my English",
      ],
    },
    routines: [],
    routineOccurrences: [],
    tasks: [],
    memories: [],
    templates: [
      {
        id: "university",
        name: "University",
        items: ["Phone", "Wallet / money", "Earbuds", "Keys"],
      },
      {
        id: "shopping",
        name: "Shopping",
        items: ["Phone", "Wallet / money", "Keys", "Shopping bag"],
      },
      {
        id: "friends",
        name: "Meeting friends",
        items: ["Phone", "Wallet / money", "Keys"],
      },
    ],
    outings: [],
  };
}
export function createOuting(
  template: Template,
  now = new Date().toISOString(),
): Outing {
  return {
    id: crypto.randomUUID(),
    name: template.name,
    templateId: template.id,
    occurrenceKey: null,
    returnReminderAt: null,
    state: "preparing",
    createdAt: now,
    startedAt: null,
    finishedAt: null,
    items: template.items.map((name) => ({
      id: crypto.randomUUID(),
      name,
      departure: "unanswered",
      returned: "unanswered",
    })),
  };
}
export function startOuting(o: Outing, now = new Date().toISOString()): Outing {
  if (
    o.state !== "preparing" ||
    !o.items.length ||
    o.items.some((i) => i.departure === "unanswered")
  )
    throw Error("Answer each departure item first.");
  return {
    ...o,
    state: "out",
    startedAt: now,
    items: o.items.map((i) => ({ ...i, returned: "unanswered" })),
  };
}
export function finishOuting(
  o: Outing,
  now = new Date().toISOString(),
): Outing {
  if (
    o.state !== "returning" ||
    o.items.some((i) => i.departure === "ready" && i.returned === "unanswered")
  )
    throw Error("Check each item you took first.");
  return { ...o, state: "finished", finishedAt: now };
}
export function localDate(now = new Date(), zone = "Asia/Baghdad") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function rankTasks(tasks: Task[], today: string) {
  return tasks
    .filter((t) => !t.done && t.kind !== "goal")
    .sort((a, b) => {
      const weight = (t: Task) =>
        (t.due && t.due < today ? 100 : 0) +
        (t.due === today ? 50 : 0) +
        (t.important ? 20 : 0);
      return (
        weight(b) - weight(a) ||
        (a.due ?? "9999").localeCompare(b.due ?? "9999") ||
        a.createdAt.localeCompare(b.createdAt)
      );
    });
}
// Converts an explicit wall-clock input using the named timezone, not the browser zone.
export function wallToInstant(value: string, zone = "Asia/Baghdad") {
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!parts) throw Error("Invalid date and time");
  const [, y, m, d, h, min] = parts.map(Number);
  const utc = Date.UTC(y, m - 1, d, h, min);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(
    fmt.formatToParts(new Date(utc)).map((p) => [p.type, p.value]),
  );
  const offset =
    Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) -
    utc;
  return new Date(utc - offset).toISOString();
}
