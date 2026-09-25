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
import type {
  RoutineSessionContext,
} from '../storage/types'
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
  routineContext?: RoutineSessionContext
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
  labelKu: string
}> = [
  {
    value: 'off',
    label: 'Off',
    labelKu: 'کوژاوە',
  },
  {
    value: 'brown',
    label: 'Brown',
    labelKu: 'براون',
  },
  {
    value: 'pink',
    label: 'Pink',
    labelKu: 'پینک',
  },
  {
    value: 'white',
    label: 'White',
    labelKu: 'وایت',
  },
  {
    value: 'binaural',
    label: 'Alpha',
    labelKu: 'ئەلفا',
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
  routineContext,
  onAddSession,
  onSelectSubject,
}: FocusPageProps) {
  const { t, tr } = useI18n()

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

  const advisorSummary =
    advisor.recommendation.type === 'unstudiedSubject'
      ? tr(
          `${advisor.recommendation.subjectName ?? ''} has not been studied this week.`,
          `${advisor.recommendation.subjectName ?? ''} ئەم هەفتەیە نەخوێندراوەتەوە.`,
        )
      : advisor.recommendation.type === 'understudiedSubject'
        ? tr(
            `${advisor.recommendation.subjectName ?? ''} is receiving very little study time.`,
            `${advisor.recommendation.subjectName ?? ''} کاتی خوێندنی زۆر کەمی پێدراوە.`,
          )
        : advisor.recommendation.type === 'shortSessions'
          ? tr(
              `Your average session is ${advisor.evidence.find((item) => item.label === 'averageSessionMinutes')?.value ?? 0} minutes; a focused 25-minute block is recommended.`,
              'ناوەندی سێشنەکانت کورتە؛ بلۆکێکی ٢٥ خولەکی سەرنج پێشنیار دەکرێت.',
            )
          : advisor.recommendation.type === 'weeklyGoal'
            ? tr(
                `You are ${advisor.recommendation.remainingMinutes ?? 0} minutes short of your weekly goal.`,
                `${advisor.recommendation.remainingMinutes ?? 0} خولەک لە ئامانجی هەفتانەت کەمە.`,
              )
            : advisor.recommendation.type === 'maintain'
              ? tr(
                  advisor.summary,
                  'ڕێتمی خوێندنت باشە. بە هەمان خێرایی بەردەوام بە.',
                )
              : tr(
                  advisor.summary,
                  'یەک سێشنی سەرنج دەست پێ بکە تا FOCUS داتای پێویست بۆ ڕێنماییت هەبێت.',
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
                {tr('Current session', 'سێشنی ئێستا')}
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
                {tr('Ready', 'ئامادە')}
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
                  routineItemId:
                    routineContext
                      ?.itemId,
                  routineDate:
                    routineContext
                      ?.routineDate,
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
                {tr('Ambient audio', 'دەنگی ژینگە')}
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
                      option.value === 'off'
                        ? tr('Off', 'کوژاوە')
                        : option.value === 'brown'
                          ? tr('Brown', 'براون')
                          : option.value === 'pink'
                            ? tr('Pink', 'پینک')
                            : option.value === 'white'
                              ? tr('White', 'سپێ')
                              : tr('Alpha', 'ئەلفا')
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
                {tr('Smart cue', 'ئاماژەی زیرەک')}
              </span>
            </div>

            <div className="focus-advisor-priority">
              {
                advisor.priority
              }{' '}
              {tr('priority', 'گرنگی')}
            </div>

            <p>
              {advisorSummary}
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
                  {tr('Switch to', 'بگۆڕە بۆ')}{' '}
                  {advisor.action
                    .subjectName ??
                    tr(tr('recommended subject', 'بابەتی پێشنیارکراو'), 'بابەتی پێشنیارکراو')}
                </button>
              )}
          </section>

          <section className="glass-panel focus-intent-card">
            <div className="focus-card-title">
              <Headphones
                size={16}
              />
              <span>
                {tr('Session intent', 'مەبەستی سێشن')}
              </span>
            </div>

            <p className="focus-intent-helper">
              {tr('Define what success looks like before you start.', 'پێش دەستپێکردن دیاری بکە سەرکەوتن بۆ ئەم سێشنە چییە.')}
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
              placeholder={tr('What are you trying to finish, understand, or practice?', 'دەتەوێت چی تەواو بکەیت، تێبگەیت یان ڕاهێنان بکەیت؟')}
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
                      aria-label={tr('Remove checklist item', 'لابردنی خاڵی لیست')}
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
                  placeholder={tr('Add a small step', 'هەنگاوێکی بچووک زیاد بکە')}
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
                  {tr('ADD', 'زیادکردن')}
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
                {tr('steps complete', 'هەنگاو تەواو')}
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
                  {tr('Clear', 'پاککردنەوە')}
                </button>
              )}
            </div>
          </section>
        </aside>
      </div>
    </PageContainer>
  )
}
