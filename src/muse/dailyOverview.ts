import { localDate, type Task } from "./domain.ts";

/** A bounded view of saved dates, not an AI judgement or a new reminder. */
export function dailyOverview(tasks: Task[], now: Date) {
  const today = localDate(now);
  const end = new Date(`${today}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 3);
  const horizon = end.toISOString().slice(0, 10);
  const candidates = tasks.filter((task) => !task.done && task.due && task.due <= horizon);
  candidates.sort((a, b) => a.due!.localeCompare(b.due!) || Number(b.important) - Number(a.important) || a.id.localeCompare(b.id));
  return {
    today,
    total: candidates.length,
    items: candidates.slice(0, 3).map((task) => ({
      task,
      reason: task.due! < today ? "review" as const : task.due === today ? "today" as const : "upcoming" as const,
    })),
  };
}
