import { useState, useEffect } from 'react'
import Timer from '../components/timer/Timer'
import type { Subject, StudySession, Subtask } from '../types'
import { useI18n } from '../useI18n'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'
import { getStudyAdvisor } from '../utils/studyAdvisor'
import { ambientAudio, type AmbientSoundType } from '../utils/ambientAudio'
import { Volume2, VolumeX } from 'lucide-react'

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
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('off')
  const [sessionNotes, setSessionNotes] = useState('')
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [subtaskDraft, setSubtaskDraft] = useState('')

  const advisor = getStudyAdvisor(sessions, subjects, weeklyGoal)
  const priorityColor =
    advisor.priority === 'high'
      ? '#ef4444'
      : advisor.priority === 'medium'
      ? '#f59e0b'
      : '#10b981'

  const handleSoundChange = (sound: AmbientSoundType) => {
    setAmbientSound(sound)
    if (sound === 'off') {
      ambientAudio.stop()
    } else {
      ambientAudio.play(sound, soundVolume / 100)
    }
  }

  const addSubtask = () => {
    const text = subtaskDraft.trim()
    if (!text) return

    setSubtasks((current) => [
      ...current,
      {
        id: 'task-' + Date.now(),
        text,
        completed: false,
      },
    ])
    setSubtaskDraft('')
  }

  useEffect(() => {
    return () => {
      ambientAudio.stop()
    }
  }, [])

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

      {/* Ambient Sound Bar */}
      <div
        className="glass-panel"
        style={{
          marginBottom: '24px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          {ambientSound === 'off' ? <VolumeX size={18} color="var(--text-secondary)" /> : <Volume2 size={18} color="var(--primary)" />}
          <span>Ambient Focus Audio:</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(['off', 'brown', 'pink', 'white', 'binaural'] as AmbientSoundType[]).map((snd) => (
            <button
              key={snd}
              type="button"
              onClick={() => handleSoundChange(snd)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: ambientSound === snd ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: ambientSound === snd ? 'var(--primary-soft)' : 'transparent',
                color: ambientSound === snd ? 'var(--primary)' : 'var(--text-secondary)',
                textTransform: 'capitalize',
              }}
            >
              {snd === 'off' ? 'Off' : snd === 'binaural' ? 'Alpha Beats' : `${snd} Noise`}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel focus-intent-card">
        <div>
          <div className="eyebrow">Session intent</div>
          <div className="focus-intent-title">
            Decide what success looks like before the timer starts.
          </div>
        </div>

        <textarea
          value={sessionNotes}
          onChange={(event) => setSessionNotes(event.target.value)}
          placeholder="What are you trying to finish, understand, or practice?"
          rows={3}
          maxLength={1000}
          className="focus-intent-notes"
        />

        <div className="focus-checklist">
          {subtasks.map((task) => (
            <label key={task.id} className="focus-checklist-item">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(event) => {
                  setSubtasks((current) =>
                    current.map((item) =>
                      item.id === task.id
                        ? { ...item, completed: event.target.checked }
                        : item,
                    ),
                  )
                }}
              />
              <span
                className={task.completed ? 'focus-checklist-text complete' : 'focus-checklist-text'}
              >
                {task.text}
              </span>
              <button
                type="button"
                aria-label="Remove checklist item"
                className="focus-checklist-remove"
                onClick={() =>
                  setSubtasks((current) =>
                    current.filter((item) => item.id !== task.id),
                  )
                }
              >
                ×
              </button>
            </label>
          ))}

          <div className="focus-checklist-compose">
            <input
              value={subtaskDraft}
              onChange={(event) => setSubtaskDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addSubtask()
                }
              }}
              placeholder="Add a small checklist step"
              maxLength={160}
            />
            <button
              type="button"
              className="cyber-btn"
              onClick={addSubtask}
              disabled={!subtaskDraft.trim()}
            >
              ADD STEP
            </button>
          </div>
        </div>
      </div>

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
          onComplete={() => ambientAudio.stop()}
          onSessionEnd={(
            duration,
            actualDuration,
            completed,
            interruptions,
            totalPausedSeconds,
            startedAt
          ) => {
            ambientAudio.stop()
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
              notes: sessionNotes.trim() || undefined,
              subtasks: subtasks.length > 0 ? subtasks : undefined,
            })
            setSessionNotes('')
            setSubtasks([])
            setSubtaskDraft('')
          }}
        />
      </div>
    </PageContainer>
  )
}
