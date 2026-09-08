import type { Subject, StudySession } from '../types'
import { useI18n } from '../useI18n'
import { getStudyPlan } from '../utils/studyPlan'
import PageContainer from './PageContainer'

interface StudyPlanPageProps {
  sessions: StudySession[]
  subjects: Subject[]
  weeklyGoal: number
  dailyGoal: number
  onDailyGoalChange: (value: number) => void
  onWeeklyGoalChange: (value: number) => void
}

export default function StudyPlanPage({ sessions, subjects, weeklyGoal, dailyGoal, onDailyGoalChange, onWeeklyGoalChange }: StudyPlanPageProps) {
  const { t } = useI18n()
  const plan = getStudyPlan(sessions, subjects, weeklyGoal)

  return (
    <PageContainer>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px' }}>{t('studyPlan')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>{t('studyPlanPageQuestion')}</p>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            {t('dailyFocusGoal')}
            <select value={dailyGoal} onChange={(e) => onDailyGoalChange(Number(e.target.value))} style={{ display: 'block', marginTop: '8px', width: '100%', padding: '10px', background: 'var(--void-surface-hover)', border: '1px solid var(--void-border)', borderRadius: '8px', color: 'var(--text-primary)' }}>
              <option value={30}>30m</option><option value={60}>1h</option><option value={90}>1.5h</option><option value={120}>2h</option><option value={180}>3h</option><option value={240}>4h</option>
            </select>
          </label>
          <label style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            {t('weeklyFocusGoal')}
            <select value={weeklyGoal} onChange={(e) => onWeeklyGoalChange(Number(e.target.value))} style={{ display: 'block', marginTop: '8px', width: '100%', padding: '10px', background: 'var(--void-surface-hover)', border: '1px solid var(--void-border)', borderRadius: '8px', color: 'var(--text-primary)' }}>
              <option value={300}>5h</option><option value={600}>10h</option><option value={900}>15h</option><option value={1200}>20h</option><option value={1500}>25h</option>
            </select>
          </label>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ color: 'var(--primary-glow)', fontFamily: 'Orbitron, sans-serif', fontSize: '11px', letterSpacing: '0.08em', marginBottom: '12px' }}>TODAY'S PLAN</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '16px' }}>{plan.totalMinutes}m planned{plan.bestTime ? ` · ${plan.bestTime}` : ''}</div>
        <div style={{ display: 'grid', gap: '10px' }}>
          {plan.items.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No plan yet. Start a session to build your study rhythm.</div> : plan.items.map((item, index) => (
            <div key={`${item.subjectId}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '14px', borderRadius: '10px', border: '1px solid var(--void-border)' }}>
              <div><div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{index + 1}. {item.subjectName}</div><div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px' }}>{item.reason}</div></div>
              <div className="mono" style={{ color: 'var(--primary-glow)' }}>{item.minutes}m</div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
