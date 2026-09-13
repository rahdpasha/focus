import { useMemo, useState } from 'react'
import type { Subject, StudySession } from '../types'
import type { AdvancedGoal, AdvancedGoalPriority } from '../storage/types'
import { useI18n } from '../useI18n'
import { getStudyPlan } from '../utils/studyPlan'
import { getDailyGoalProgress, getWeeklyGoalProgress } from '../utils/goalProgress'
import { getAdvancedGoalProgress } from '../utils/advancedGoals'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'

interface StudyPlanPageProps {
  sessions: StudySession[]
  subjects: Subject[]
  weeklyGoal: number
  dailyGoal: number
  advancedGoals: AdvancedGoal[]
  onDailyGoalChange: (value: number) => void
  onWeeklyGoalChange: (value: number) => void
  onAddAdvancedGoal: (
    title: string,
    targetMinutes: number,
    deadline: string,
    priority: AdvancedGoalPriority,
  ) => void
  onUpdateAdvancedGoal: (
    id: string,
    patch: Partial<Omit<AdvancedGoal, 'id' | 'createdAt'>>,
  ) => void
  onDeleteAdvancedGoal: (id: string) => void
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No deadline'
  return date.toLocaleDateString()
}

export default function StudyPlanPage({
  sessions,
  subjects,
  weeklyGoal,
  dailyGoal,
  advancedGoals,
  onDailyGoalChange,
  onWeeklyGoalChange,
  onAddAdvancedGoal,
  onUpdateAdvancedGoal,
  onDeleteAdvancedGoal,
}: StudyPlanPageProps) {
  const { t } = useI18n()
  const plan = getStudyPlan(sessions, subjects, weeklyGoal, dailyGoal)
  const dailyProgress = getDailyGoalProgress(sessions, dailyGoal)
  const weeklyProgress = getWeeklyGoalProgress(sessions, weeklyGoal)

  const [title, setTitle] = useState('')
  const [targetMinutes, setTargetMinutes] = useState('600')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] =
    useState<AdvancedGoalPriority>('medium')

  const activeGoals = useMemo(
    () => advancedGoals.filter((goal) => goal.status === 'active'),
    [advancedGoals],
  )

  const completedGoals = useMemo(
    () => advancedGoals.filter((goal) => goal.status === 'completed'),
    [advancedGoals],
  )

  const createGoal = () => {
    const minutes = Number(targetMinutes)

    if (!title.trim()) return
    if (!Number.isFinite(minutes) || minutes <= 0) return
    const effectiveDeadline =
      deadline ||
      new Date(Date.now() + 14 * 86400000)
        .toISOString()
        .slice(0, 10)

    onAddAdvancedGoal(
      title,
      minutes,
      effectiveDeadline,
      priority,
    )

    setTitle('')
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('studyPlan')}
        description={t('studyPlanPageQuestion')}
      />

      <div
        className="glass-panel"
        style={{ padding: '20px', marginBottom: '16px' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
          }}
        >
          <label
            style={{
              color: 'var(--text-muted)',
              fontSize: '11px',
            }}
          >
            DAILY FOCUS GOAL
            <select
              value={dailyGoal}
              onChange={(e) =>
                onDailyGoalChange(Number(e.target.value))
              }
              style={{
                display: 'block',
                marginTop: '8px',
                width: '100%',
                padding: '10px',
                background: 'var(--void-surface-hover)',
                border: '1px solid var(--void-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            >
              <option value={30}>30m</option>
              <option value={60}>1h</option>
              <option value={90}>1.5h</option>
              <option value={120}>2h</option>
              <option value={180}>3h</option>
              <option value={240}>4h</option>
            </select>
          </label>

          <label
            style={{
              color: 'var(--text-muted)',
              fontSize: '11px',
            }}
          >
            WEEKLY FOCUS GOAL
            <select
              value={weeklyGoal}
              onChange={(e) =>
                onWeeklyGoalChange(Number(e.target.value))
              }
              style={{
                display: 'block',
                marginTop: '8px',
                width: '100%',
                padding: '10px',
                background: 'var(--void-surface-hover)',
                border: '1px solid var(--void-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            >
              <option value={300}>5h</option>
              <option value={600}>10h</option>
              <option value={900}>15h</option>
              <option value={1200}>20h</option>
              <option value={1500}>25h</option>
            </select>
          </label>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          {[
            ['TODAY', dailyProgress],
            ['THIS WEEK', weeklyProgress],
          ].map(([label, progress]) => {
            const value =
              progress as typeof dailyProgress

            return (
              <div
                key={label as string}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border:
                    '1px solid var(--void-border)',
                  background:
                    'var(--void-surface-hover)',
                }}
              >
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                  }}
                >
                  {label as string}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginTop: '8px',
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      color: 'var(--primary-glow)',
                      fontSize: '18px',
                    }}
                  >
                    {value.minutes}m
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                      }}
                    >
                      {' '}
                      / {value.goal}m
                    </span>
                  </div>

                  <div
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                    }}
                  >
                    {value.percent}%
                  </div>
                </div>

                <div
                  style={{
                    height: '6px',
                    marginTop: '10px',
                    borderRadius: '999px',
                    background: 'var(--void-border)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${value.percent}%`,
                      height: '100%',
                      background:
                        'var(--primary-glow)',
                    }}
                  />
                </div>

                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '10px',
                    marginTop: '7px',
                  }}
                >
                  {value.remaining}m remaining
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div
        className="glass-panel"
        style={{
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            color: 'var(--primary-glow)',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '11px',
            letterSpacing: '0.08em',
            marginBottom: '14px',
          }}
        >
          ADVANCED GOALS
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(180px, 2fr) repeat(3, minmax(120px, 1fr)) auto',
            gap: '10px',
            alignItems: 'end',
          }}
        >
          <label
            style={{
              color: 'var(--text-muted)',
              fontSize: '10px',
            }}
          >
            GOAL
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Finish database project"
              style={{
                display: 'block',
                width: '100%',
                marginTop: '7px',
                padding: '10px',
                boxSizing: 'border-box',
                background:
                  'var(--void-surface-hover)',
                border:
                  '1px solid var(--void-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
          </label>

          <label
            style={{
              color: 'var(--text-muted)',
              fontSize: '10px',
            }}
          >
            TARGET
            <input
              type="number"
              min="1"
              value={targetMinutes}
              onChange={(e) =>
                setTargetMinutes(e.target.value)
              }
              style={{
                display: 'block',
                width: '100%',
                marginTop: '7px',
                padding: '10px',
                boxSizing: 'border-box',
                background:
                  'var(--void-surface-hover)',
                border:
                  '1px solid var(--void-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
          </label>

          <label
            style={{
              color: 'var(--text-muted)',
              fontSize: '10px',
            }}
          >
            DEADLINE
            <input
              type="date"
              value={deadline}
              onChange={(e) =>
                setDeadline(e.target.value)
              }
              style={{
                display: 'block',
                width: '100%',
                marginTop: '7px',
                padding: '10px',
                boxSizing: 'border-box',
                background:
                  'var(--void-surface-hover)',
                border:
                  '1px solid var(--void-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
          </label>

          <label
            style={{
              color: 'var(--text-muted)',
              fontSize: '10px',
            }}
          >
            PRIORITY
            <select
              value={priority}
              onChange={(e) =>
                setPriority(
                  e.target.value as AdvancedGoalPriority,
                )
              }
              style={{
                display: 'block',
                width: '100%',
                marginTop: '7px',
                padding: '10px',
                boxSizing: 'border-box',
                background:
                  'var(--void-surface-hover)',
                border:
                  '1px solid var(--void-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <button
            className="cyber-btn"
            type="button"
            onClick={createGoal}
          >
            ADD
          </button>
        </div>

        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: '10px',
            marginTop: '8px',
          }}
        >
          Target is study minutes. Completed focus sessions
          automatically increase progress.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {activeGoals.length === 0 && (
          <div
            className="glass-panel"
            style={{
              padding: '20px',
              color: 'var(--text-muted)',
              fontSize: '12px',
            }}
          >
            No active advanced goals yet.
          </div>
        )}

        {activeGoals.map((goal) => {
          const progress = getAdvancedGoalProgress(
            goal,
            sessions,
          )

          const effectiveCompleted =
            progress.completed

          return (
            <div
              key={goal.id}
              className="glass-panel"
              style={{ padding: '18px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div
                    style={{
                      color:
                        'var(--text-primary)',
                      fontSize: '15px',
                      fontWeight: 600,
                    }}
                  >
                    {goal.title}
                  </div>

                  <div
                    style={{
                      color:
                        'var(--text-muted)',
                      fontSize: '10px',
                      marginTop: '5px',
                    }}
                  >
                    {formatMinutes(progress.minutes)} /{' '}
                    {formatMinutes(goal.targetMinutes)}
                    {' · '}
                    Deadline {formatDate(goal.deadline)}
                    {' · '}
                    {goal.priority.toUpperCase()}
                  </div>
                </div>

                <div
                  style={{
                    color: progress.overdue
                      ? '#ff6b6b'
                      : 'var(--primary-glow)',
                    fontSize: '12px',
                    fontFamily:
                      'Orbitron, sans-serif',
                  }}
                >
                  {progress.percent}%
                </div>
              </div>

              <div
                style={{
                  height: '8px',
                  marginTop: '14px',
                  borderRadius: '999px',
                  background: 'var(--void-border)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress.percent}%`,
                    height: '100%',
                    background:
                      'var(--primary-glow)',
                    transition:
                      'width 300ms ease',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '12px',
                }}
              >
                <div
                  style={{
                    color: progress.overdue
                      ? '#ff6b6b'
                      : 'var(--text-muted)',
                    fontSize: '10px',
                  }}
                >
                  {effectiveCompleted
                    ? 'TARGET REACHED'
                    : progress.overdue
                      ? 'OVERDUE'
                      : `${formatMinutes(progress.remainingMinutes)} remaining`}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <button
                    className="cyber-btn"
                    type="button"
                    onClick={() =>
                      onUpdateAdvancedGoal(
                        goal.id,
                        {
                          status:
                            effectiveCompleted
                              ? 'active'
                              : 'completed',
                        },
                      )
                    }
                  >
                    {effectiveCompleted
                      ? 'REOPEN'
                      : 'COMPLETE'}
                  </button>

                  <button
                    className="cyber-btn"
                    type="button"
                    onClick={() =>
                      onDeleteAdvancedGoal(
                        goal.id,
                      )
                    }
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {completedGoals.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '18px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              color: 'var(--primary-glow)',
              fontFamily:
                'Orbitron, sans-serif',
              fontSize: '10px',
              letterSpacing: '0.08em',
              marginBottom: '12px',
            }}
          >
            COMPLETED GOALS
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            {completedGoals.map((goal) => {
              const progress =
                getAdvancedGoalProgress(
                  goal,
                  sessions,
                )

              return (
                <div
                  key={goal.id}
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '12px',
                    border:
                      '1px solid var(--void-border)',
                    borderRadius: '9px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        color:
                          'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    >
                      {goal.title}
                    </div>

                    <div
                      style={{
                        color:
                          'var(--text-muted)',
                        fontSize: '10px',
                        marginTop: '4px',
                      }}
                    >
                      {formatMinutes(
                        progress.minutes,
                      )}{' '}
                      studied
                    </div>
                  </div>

                  <button
                    className="cyber-btn"
                    type="button"
                    onClick={() =>
                      onDeleteAdvancedGoal(
                        goal.id,
                      )
                    }
                  >
                    REMOVE
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px' }}>
        <div
          style={{
            color: 'var(--primary-glow)',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '11px',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          }}
        >
          TODAY'S PLAN
        </div>

        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: '11px',
            marginBottom: '16px',
          }}
        >
          {plan.totalMinutes}m planned
          {plan.bestTime ? ` · ${plan.bestTime}` : ''}
        </div>

        <div
          style={{
            marginBottom: '14px',
            padding: '12px 14px',
            borderRadius: '10px',
            border:
              '1px solid var(--void-border)',
            background:
              'var(--void-surface-hover)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: '10px',
                letterSpacing: '0.08em',
              }}
            >
              WHY THIS PLAN
            </div>

            <div
              style={{
                color: 'var(--primary-glow)',
                fontSize: '10px',
                textTransform: 'uppercase',
              }}
            >
              {plan.priority}
            </div>
          </div>

          <div
            style={{
              color: 'var(--text-primary)',
              fontSize: '12px',
              marginTop: '7px',
              lineHeight: 1.5,
            }}
          >
            {plan.rationale}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {plan.items.length === 0 ? (
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: '12px',
              }}
            >
              No plan yet. Start a session to build
              your study rhythm.
            </div>
          ) : (
            plan.items.map((item, index) => (
              <div
                key={`${item.subjectId}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  gap: '16px',
                  padding: '14px',
                  borderRadius: '10px',
                  border:
                    '1px solid var(--void-border)',
                }}
              >
                <div>
                  <div
                    style={{
                      color:
                        'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  >
                    {index + 1}. {item.subjectName}
                  </div>

                  <div
                    style={{
                      color:
                        'var(--text-muted)',
                      fontSize: '10px',
                      marginTop: '4px',
                    }}
                  >
                    {item.reason}
                  </div>
                </div>

                <div
                  className="mono"
                  style={{
                    color:
                      'var(--primary-glow)',
                  }}
                >
                  {item.minutes}m
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  )
}
