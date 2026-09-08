import Timer from '../components/timer/Timer'
import type { Subject, StudySession } from '../types'
import { useI18n } from '../useI18n'
import PageContainer from './PageContainer'

interface FocusPageProps {
  activeSubject: Subject | undefined
  shortBreak: number
  longBreak: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  soundEnabled: boolean
  soundVolume: number
  notificationsEnabled: boolean
  onAddSession: (session: StudySession) => void
}

export default function FocusPage({
  activeSubject,
  shortBreak,
  longBreak,
  sessionsBeforeLongBreak,
  autoStartBreak,
  soundEnabled,
  soundVolume,
  notificationsEnabled,
  onAddSession,
}: FocusPageProps) {
  const { t } = useI18n()

  return (
    <PageContainer>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px' }}>
          {t('focus')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>
          {t('focusPageQuestion')}
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '48px', display: 'flex', justifyContent: 'center' }}>
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
          onComplete={() => {}}
          onSessionEnd={(duration, actualDuration, completed, interruptions, totalPausedSeconds, startedAt) => {
            if (!activeSubject) return
            onAddSession({
              id: `s${Date.now()}`,
              subjectId: activeSubject.id,
              subjectName: activeSubject.name,
              subjectColor: activeSubject.color,
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
