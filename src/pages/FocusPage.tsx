import Timer from '../components/timer/Timer'
import type { Subject, StudySession } from '../types'
import { useI18n } from '../useI18n'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'

interface FocusPageProps {
  activeSubject: Subject | undefined
  shortBreak: number
  longBreak: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  soundEnabled: boolean
  soundVolume: number
  notificationsEnabled: boolean
  initialFocusMinutes?: number
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
  initialFocusMinutes,
  onAddSession,
}: FocusPageProps) {
  const { t } = useI18n()

  return (
    <PageContainer>
      <PageHeader title={t('focus')} description={t('focusPageQuestion')} />

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
          initialFocusMinutes={initialFocusMinutes}
          onComplete={() => {}}
          onSessionEnd={(duration, actualDuration, completed, interruptions, totalPausedSeconds, startedAt) => {
            type LocalSubject = { id: string; name: string; color: string };
    const subjects: LocalSubject[] = [];
    const targetSubject = (activeSubject as LocalSubject | null) ?? subjects[0] ?? { id: "", name: "", color: "" };
            if (!targetSubject) {
              console.warn("[FocusPage] Cannot save session: No subjects exist.");
              return;
            }
            onAddSession({
              id: "s" + Date.now(),
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
            });
          }}
        />
      </div>
    </PageContainer>
  )
}
