import Timer from '../components/timer/Timer'
import type { Subject, StudySession } from '../types'
import { useI18n } from '../useI18n'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'
import { getStudyAdvisor } from '../utils/studyAdvisor'

interface FocusPageProps {
  activeSubject: Subject | undefined
  subjects?: Subject[]
  sessions?: StudySession[]
  weeklyGoal?: number
  shortBreak: number
  longBreak: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  soundEnabled: boolean
  soundVolume: number
  notificationsEnabled: boolean
  initialFocusMinutes?: number
  onAddSession: (session: StudySession) => void
  onSelectSubject?: (subjectId: string) => void
}

export default function FocusPage({
  activeSubject,
  subjects = [],
  sessions = [],
  weeklyGoal = 1050,
  shortBreak,
  longBreak,
  sessionsBeforeLongBreak,
  autoStartBreak,
  soundEnabled,
  soundVolume,
  notificationsEnabled,
  initialFocusMinutes,
  onAddSession,
  onSelectSubject,
}: FocusPageProps) {
  const { t } = useI18n()

  const advisor = getStudyAdvisor(sessions, subjects, weeklyGoal)
  const priorityColor =
    advisor.priority === 'high'
      ? '#ef4444'
      : advisor.priority === 'medium'
      ? '#f59e0b'
      : '#10b981'

  return (
    <PageContainer>
      <PageHeader title={t('focus')} description={t('focusPageQuestion')} />

      {advisor && advisor.summary && (
        <div
          className="glass-panel"
          style={{
            marginBottom: '24px',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            borderLeft: `4px solid ${priorityColor}`,
            background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: priorityColor,
                marginBottom: '4px',
              }}
            >
              {t('recommendationTitle')}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              {advisor.summary}
            </div>
          </div>

          {advisor.action.subjectId &&
            advisor.action.subjectId !== activeSubject?.id &&
            onSelectSubject && (
              <button
                type="button"
                className="button-secondary"
                onClick={() => advisor.action.subjectId && onSelectSubject(advisor.action.subjectId)}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                Switch to {advisor.action.subjectName}
              </button>
            )}
        </div>
      )}

      <div
        className="glass-panel"
        style={{ padding: '48px', display: 'flex', justifyContent: 'center' }}
      >
        <Timer
          subjectName={activeSubject?.name || t('selectSubject')}
          subjectColor={activeSubject?.color || '#8b5cf6'}
          shortBreakMinutes={shortBreak}
          longBreakMinutes={longBreak}
          sessionsBeforeLongBreak={sessionsBeforeLongBreak}
          autoStartBreak={autoStartBreak}
          soundEnabled={soundEnabled}
          soundVolume={soundVolume}
          notificationsEnabled={notificationsEnabled}
          initialFocusMinutes={initialFocusMinutes}
          onComplete={() => {}}
          onSessionEnd={(
            duration,
            actualDuration,
            completed,
            interruptions,
            totalPausedSeconds,
            startedAt
          ) => {
            const targetSubject = activeSubject ?? subjects[0] ?? {
              id: '',
              name: '',
              color: '',
            }
            if (!targetSubject.id) {
              console.warn('[FocusPage] Cannot save session: No subjects exist.')
              return
            }
            onAddSession({
              id: 's' + Date.now(),
              subjectId: targetSubject.id,
              subjectName: targetSubject.name,
              subjectColor: targetSubject.color,
              duration,
              actualDuration,
              startedAt,
              completedAt: new Date(),
              completed,
              interruptions,
              totalPausedSeconds,
            })
          }}
        />
      </div>
    </PageContainer>
  )
}
