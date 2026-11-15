import { localDate, rankTasks, wallToInstant, type Task } from "./domain.ts";

export function morningPriority(tasks: Task[], now: Date) {
  const today = localDate(now);
  const briefingTime = Date.parse(wallToInstant(`${today}T07:30`));
  if (now.getTime() < briefingTime) return undefined;

  // An upcoming event can need preparation even when nothing is due today.
  const tomorrow = localDate(new Date(briefingTime + 24 * 60 * 60 * 1000));
  return rankTasks(tasks, today).find((task) =>
    (task.due !== null && task.due <= tomorrow) ||
    (task.due === null && task.important),
  );
}
