import type { PersonalRecords } from './personalRecords'

export interface RecordMetric {
  id: string
  label: string
  value: string
}

const formatMinutes = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return remaining ? `${minutes}m ${remaining}s` : `${minutes}m`
}

export function getRecordsViewModel(
  records: PersonalRecords,
  daysLabel: string,
): RecordMetric[] {
  return [
    { id: 'longest-session', label: 'LONGEST SESSION', value: formatMinutes(records.longestSessionSeconds) },
    { id: 'best-day', label: 'BEST DAY', value: `${records.bestDayMinutes}m` },
    { id: 'best-week', label: 'BEST WEEK', value: `${records.bestWeekMinutes}m` },
    { id: 'best-subject', label: 'BEST SUBJECT', value: records.bestSubjectName ?? '—' },
    { id: 'best-subject-time', label: 'BEST SUBJECT TIME', value: `${records.bestSubjectMinutes}m` },
    { id: 'best-daily-streak', label: 'BEST DAILY STREAK', value: `${records.bestDailyStreak} ${daysLabel}` },
    { id: 'best-weekday', label: 'BEST WEEKDAY', value: records.bestDayWeekday ?? '—' },
    { id: 'day-average', label: 'DAY AVERAGE', value: `${records.bestDayAverageMinutes}m` },
  ]
}
