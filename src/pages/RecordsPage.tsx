import type { StudySession } from '../types'
import { useI18n } from '../useI18n'
import { getPersonalRecords } from '../utils/personalRecords'
import PageContainer from './PageContainer'

interface RecordsPageProps { sessions: StudySession[]; weeklyGoal: number }

const formatMinutes = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return remaining ? `${minutes}m ${remaining}s` : `${minutes}m`
}

export default function RecordsPage({ sessions, weeklyGoal }: RecordsPageProps) {
  const { t } = useI18n()
  const records = getPersonalRecords(sessions, weeklyGoal)
  const items = [
    ['LONGEST SESSION', formatMinutes(records.longestSessionSeconds)],
    ['BEST DAY', `${records.bestDayMinutes}m`],
    ['BEST WEEK', `${records.bestWeekMinutes}m`],
    ['BEST SUBJECT', records.bestSubjectName ?? '—'],
    ['BEST SUBJECT TIME', `${records.bestSubjectMinutes}m`],
    ['BEST DAILY STREAK', `${records.bestDailyStreak} ${t('days')}`],
    ['BEST WEEKDAY', records.bestDayWeekday ?? '—'],
    ['DAY AVERAGE', `${records.bestDayAverageMinutes}m`],
  ]

  return (
    <PageContainer>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px' }}>{t('records')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>{t('recordsPageQuestion')}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
        {items.map(([label, value]) => (
          <div key={label} className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ color: 'var(--text-muted)', fontFamily: 'Orbitron, sans-serif', fontSize: '10px', letterSpacing: '0.06em' }}>{label}</div>
            <div className="mono" style={{ color: 'var(--text-primary)', fontSize: '20px', marginTop: '10px' }}>{value}</div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
