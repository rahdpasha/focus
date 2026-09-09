import type { StudySession } from '../types'
import { useI18n } from '../useI18n'
import { getPersonalRecords } from '../utils/personalRecords'
import { getRecordsViewModel } from '../utils/recordsViewModel'
import PageContainer from './PageContainer'
import RecordCard from '../components/records/RecordCard'

interface RecordsPageProps {
  sessions: StudySession[]
  weeklyGoal: number
}

export default function RecordsPage({ sessions, weeklyGoal }: RecordsPageProps) {
  const { t } = useI18n()
  const records = getPersonalRecords(sessions, weeklyGoal)
  const items = getRecordsViewModel(records, t('days'))

  return (
    <PageContainer>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px' }}>{t('records')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>{t('recordsPageQuestion')}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
        {items.map((item) => (
          <RecordCard key={item.id} label={item.label} value={item.value} />
        ))}
      </div>
    </PageContainer>
  )
}
