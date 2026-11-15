import { localDate, wallToInstant, type Task } from "./domain.ts";
import type { StudySession } from "../types.ts";

const week = 7 * 24 * 60 * 60 * 1000;

export function weeklyReview(now: Date, tasks: Task[], sessions: StudySession[]) {
  const today = localDate(now);
  const saturday = new Date(`${today}T12:00:00Z`);
  saturday.setUTCDate(saturday.getUTCDate() - (saturday.getUTCDay() + 1) % 7);
  const cutoff = Date.parse(wallToInstant(`${saturday.toISOString().slice(0, 10)}T19:00`));
  const end = now.getTime() < cutoff ? cutoff - week : cutoff;
  const start = end - week;
  const inReview = (stamp: number) => stamp >= start && stamp < end;
  const completed = tasks.filter(task => task.done && task.completedAt && inReview(Date.parse(task.completedAt)));
  const pending = tasks.filter(task => !task.done && task.due).sort((a, b) => a.due!.localeCompare(b.due!));
  const pastDates = pending.filter(task => task.due! < today);
  const upcoming = pending.filter(task => task.due! >= today && task.due! <= localDate(new Date(now.getTime() + week)));
  const subjects = new Map<string, { name: string; seconds: number }>();
  for (const session of sessions) {
    if (!session.completed || session.actualDuration <= 0 || !inReview(new Date(session.completedAt).getTime())) continue;
    const seconds = (subjects.get(session.subjectId)?.seconds ?? 0) + session.actualDuration;
    subjects.set(session.subjectId, { name: session.subjectName, seconds });
  }
  return {
    start: new Date(start),
    end: new Date(end),
    key: localDate(new Date(end)),
    completed,
    pastDates,
    upcoming,
    subjects: [...subjects.entries()].sort(([, a], [, b]) => b.seconds - a.seconds),
  };
}
