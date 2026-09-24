import {
  Headphones,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  useEffect,
  useState,
} from 'react'
import Timer from '../components/timer/Timer'
import type {
  Subject,
  StudySession,
  Subtask,
} from '../types'
import {
  useI18n,
} from '../useI18n'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'
import {
  getStudyAdvisor,
} from '../utils/studyAdvisor'
import {
  ambientAudio,
  type AmbientSoundType,
} from '../utils/ambientAudio'

interface FocusPageProps {
  activeSubject:
    | Subject
    | undefined
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
  onAddSession: (
    session: StudySession,
  ) => void
  onSelectSubject?: (
    subjectId: string,
  ) => void
}

const ambientOptions: Array<{
  value: AmbientSoundType
  label: string
}> = [
  {
    value: 'off',
    label: 'Off',
  },
  {
    value: 'brown',
    label: 'Brown',
  },
  {
    value: 'pink',
    label: 'Pink',
  },
  {
    value: 'white',
    label: 'White',
  },
  {
    value: 'binaural',
    label: 'Alpha',
  },
]

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

  const [
    ambientSound,
    setAmbientSound,
  ] =
    useState<AmbientSoundType>(
      'off',
    )
  const [
    sessionNotes,
    setSessionNotes,
  ] = useState('')
  const [
    subtasks,
    setSubtasks,
  ] = useState<Subtask[]>([])
  const [
    subtaskDraft,
    setSubtaskDraft,
  ] = useState('')

  const advisor =
    getStudyAdvisor(
      sessions,
      subjects,
      weeklyGoal,
    )

  const targetSubject =
    activeSubject ??
    subjects[0]

  const handleSoundChange = (
    sound: AmbientSoundType,
  ) => {
    setAmbientSound(sound)

    if (sound === 'off') {
      ambientAudio.stop()
      return
    }

    ambientAudio.play(
      sound,
      soundVolume / 100,
    )
  }

  const addSubtask = () => {
    const text =
      subtaskDraft.trim()

    if (!text) return

    setSubtasks(
      (current) => [
        ...current,
        {
          id:
            'task-' +
            Date.now(),
          text,
          completed:
            false,
        },
      ],
    )

    setSubtaskDraft('')
  }

  const resetIntent = () => {
    setSessionNotes('')
    setSubtasks([])
    setSubtaskDraft('')
  }

  useEffect(() => {
    return () => {
      ambientAudio.stop()
    }
  }, [])

  return (
    <PageContainer>
      <PageHeader
        title={t('focus')}
        description={t(
          'focusPageQuestion',
        )}
      />

      <div className="focus-workspace">
        <section className="glass-panel focus-timer-stage">
          <div className="focus-stage-head">
            <div>
              <div className="eyebrow">
                Current session
              </div>
              <h2>
                {targetSubject
                  ?.name ??
                  t(
                    'selectSubject',
                  )}
              </h2>
            </div>

            {targetSubject && (
              <span
                className="focus-subject-pill"
                style={{
                  borderColor:
                    targetSubject.color,
                  color:
                    targetSubject.color,
                }}
              >
                <span
                  style={{
                    background:
                      targetSubject.color,
                  }}
                />
                Ready
              </span>
            )}
          </div>

          <div className="focus-timer-wrap">
            <Timer
              subjectName={
                targetSubject?.name ||
                t(
                  'selectSubject',
                )
              }
              subjectColor={
                targetSubject?.color ||
                '#8b5cf6'
              }
              shortBreakMinutes={
                shortBreak
              }
              longBreakMinutes={
                longBreak
              }
              sessionsBeforeLongBreak={
                sessionsBeforeLongBreak
              }
              autoStartBreak={
                autoStartBreak
              }
              soundEnabled={
                soundEnabled
              }
              soundVolume={
                soundVolume
              }
              notificationsEnabled={
                notificationsEnabled
              }
              initialFocusMinutes={
                initialFocusMinutes
              }
              onComplete={() =>
                ambientAudio.stop()
              }
              onSessionEnd={(
                duration,
                actualDuration,
                completed,
                interruptions,
                totalPausedSeconds,
                startedAt,
              ) => {
                ambientAudio.stop()

                if (
                  !targetSubject
                ) {
                  console.warn(
                    '[FocusPage] Cannot save session: No subjects exist.',
                  )
                  return
                }

                onAddSession({
                  id:
                    's' +
                    Date.now(),
                  subjectId:
                    targetSubject.id,
                  subjectName:
                    targetSubject.name,
                  subjectColor:
                    targetSubject.color,
                  duration,
                  actualDuration,
                  startedAt,
                  completedAt:
                    new Date(),
                  completed,
                  interruptions,
                  totalPausedSeconds,
                  notes:
                    sessionNotes.trim() ||
                    undefined,
                  subtasks:
                    subtasks.length >
                    0
                      ? subtasks
                      : undefined,
                })

                resetIntent()
              }}
            />
          </div>

          <div className="focus-audio">
            <div className="focus-audio-label">
              {ambientSound ===
              'off' ? (
                <VolumeX
                  size={16}
                />
              ) : (
                <Volume2
                  size={16}
                />
              )}
              <span>
                Ambient audio
              </span>
            </div>

            <div className="focus-audio-options">
              {ambientOptions.map(
                (option) => (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    className={
                      ambientSound ===
                      option.value
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      handleSoundChange(
                        option.value,
                      )
                    }
                  >
                    {
                      option.label
                    }
                  </button>
                ),
              )}
            </div>
          </div>
        </section>

        <aside className="focus-side-stack">
          <section className="glass-panel focus-advisor-card">
            <div className="focus-card-title">
              <Sparkles
                size={16}
              />
              <span>
                Smart cue
              </span>
            </div>

            <div className="focus-advisor-priority">
              {
                advisor.priority
              }{' '}
              priority
            </div>

            <p>
              {advisor.summary}
            </p>

            {advisor.action
              .subjectId &&
              advisor.action
                .subjectId !==
                targetSubject?.id &&
              onSelectSubject && (
                <button
                  type="button"
                  className="focus-switch-subject"
                  onClick={() =>
                    advisor.action
                      .subjectId &&
                    onSelectSubject(
                      advisor.action
                        .subjectId,
                    )
                  }
                >
                  Switch to{' '}
                  {advisor.action
                    .subjectName ??
                    'recommended subject'}
                </button>
              )}
          </section>

          <section className="glass-panel focus-intent-card">
            <div className="focus-card-title">
              <Headphones
                size={16}
              />
              <span>
                Session intent
              </span>
            </div>

            <p className="focus-intent-helper">
              Define what success
              looks like before you
              start.
            </p>

            <textarea
              value={
                sessionNotes
              }
              onChange={(
                event,
              ) =>
                setSessionNotes(
                  event.target
                    .value,
                )
              }
              placeholder="What are you trying to finish, understand, or practice?"
              rows={3}
              maxLength={1000}
              className="focus-intent-notes"
            />

            <div className="focus-checklist">
              {subtasks.map(
                (task) => (
                  <label
                    key={
                      task.id
                    }
                    className="focus-checklist-item"
                  >
                    <input
                      type="checkbox"
                      checked={
                        task.completed
                      }
                      onChange={(
                        event,
                      ) => {
                        setSubtasks(
                          (
                            current,
                          ) =>
                            current.map(
                              (
                                item,
                              ) =>
                                item.id ===
                                task.id
                                  ? {
                                      ...item,
                                      completed:
                                        event
                                          .target
                                          .checked,
                                    }
                                  : item,
                            ),
                        )
                      }}
                    />

                    <span
                      className={
                        task.completed
                          ? 'focus-checklist-text complete'
                          : 'focus-checklist-text'
                      }
                    >
                      {
                        task.text
                      }
                    </span>

                    <button
                      type="button"
                      aria-label="Remove checklist item"
                      className="focus-checklist-remove"
                      onClick={() =>
                        setSubtasks(
                          (
                            current,
                          ) =>
                            current.filter(
                              (
                                item,
                              ) =>
                                item.id !==
                                task.id,
                            ),
                        )
                      }
                    >
                      ×
                    </button>
                  </label>
                ),
              )}

              <div className="focus-checklist-compose">
                <input
                  value={
                    subtaskDraft
                  }
                  onChange={(
                    event,
                  ) =>
                    setSubtaskDraft(
                      event.target
                        .value,
                    )
                  }
                  onKeyDown={(
                    event,
                  ) => {
                    if (
                      event.key ===
                      'Enter'
                    ) {
                      event.preventDefault()
                      addSubtask()
                    }
                  }}
                  placeholder="Add a small step"
                  maxLength={160}
                />

                <button
                  type="button"
                  className="cyber-btn"
                  onClick={
                    addSubtask
                  }
                  disabled={
                    !subtaskDraft.trim()
                  }
                >
                  ADD
                </button>
              </div>
            </div>

            <div className="focus-intent-meta">
              <span>
                {
                  subtasks.filter(
                    (task) =>
                      task.completed,
                  ).length
                }
                /
                {
                  subtasks.length
                }{' '}
                steps complete
              </span>

              {(sessionNotes ||
                subtasks.length >
                  0) && (
                <button
                  type="button"
                  onClick={
                    resetIntent
                  }
                >
                  Clear
                </button>
              )}
            </div>
          </section>
        </aside>
      </div>
    </PageContainer>
  )
}
