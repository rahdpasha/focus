import type { StudySession } from '../types'
import { getDailyStreak, getStartOfWeek } from './goalHistory.ts'
export const localDayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
export function getFocusSummary(sessions: StudySession[], now = new Date()) {
  const complete = sessions.filter(s => s.completed && s.actualDuration > 0)
  const today = complete.filter(s => localDayKey(new Date(s.completedAt)) === localDayKey(now))
  const start = getStartOfWeek(now)
  const end = new Date(start); end.setDate(end.getDate() + 7)
  const week = complete.filter(s => new Date(s.completedAt) >= start && new Date(s.completedAt) < end)
  const days = Array.from({ length: 7 }, (_, i) => { const date = new Date(start); date.setDate(date.getDate() + i); return { date, minutes: Math.round(week.filter(s => localDayKey(new Date(s.completedAt)) === localDayKey(date)).reduce((n,s) => n+s.actualDuration,0)/60) } })
  const subjects = new Map<string, {name:string;color:string;seconds:number}>()
  week.forEach(s => { const item = subjects.get(s.subjectId) ?? { name:s.subjectName,color:s.subjectColor,seconds:0 }; item.seconds += s.actualDuration; subjects.set(s.subjectId,item) })
  return { todayMinutes: Math.round(today.reduce((n,s) => n+s.actualDuration,0)/60), todaySessions: today.length, weekMinutes: Math.round(week.reduce((n,s) => n+s.actualDuration,0)/60), streak:getDailyStreak(sessions), days, subjects:[...subjects.values()].sort((a,b) => b.seconds-a.seconds) }
}
