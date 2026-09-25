import {
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import type {
  Subject,
  StudySession,
} from '../types'
import type {
  AdvancedGoal,
} from '../storage/types'
import {
  getAdvancedGoalProgress,
} from '../utils/advancedGoals'
import { useI18n } from '../useI18n'
import { getStudyPlan } from '../utils/studyPlan'
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
    priority: AdvancedGoal['priority'],
    subjectId?: string,
  ) => void
  onUpdateAdvancedGoal: (
    id: string,
    patch: Partial<Omit<AdvancedGoal, 'id' | 'createdAt'>>,
  ) => void
  onDeleteAdvancedGoal: (id: string) => void
  onStartSession: (
    subjectId?: string,
    minutes?: number,
  ) => void
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
  onStartSession,
}: StudyPlanPageProps) {
  const { t } = useI18n()
  const [goalTitle, setGoalTitle] = useState('')
  const [goalTarget, setGoalTarget] = useState(300)
  const [goalDeadline, setGoalDeadline] = useState('')
  const [goalSubjectId, setGoalSubjectId] = useState('')
  const [goalPriority, setGoalPriority] =
    useState<AdvancedGoal['priority']>('medium')
  const [pendingGoalDelete, setPendingGoalDelete] =
    useState<string | null>(null)

  const advancedGoalCards = useMemo(
    () =>
      advancedGoals
        .map((goal) => ({
          goal,
          progress: getAdvancedGoalProgress(goal, sessions),
        }))
        .sort((a, b) => {
          if (a.progress.completed !== b.progress.completed) {
            return a.progress.completed ? 1 : -1
          }

          if (a.progress.overdue !== b.progress.overdue) {
            return a.progress.overdue ? -1 : 1
          }

          const priorityWeight = {
            high: 3,
            medium: 2,
            low: 1,
          }

          const priorityDifference =
            priorityWeight[b.goal.priority] -
            priorityWeight[a.goal.priority]

          if (priorityDifference !== 0) {
            return priorityDifference
          }

          return (
            new Date(a.goal.deadline).getTime() -
            new Date(b.goal.deadline).getTime()
          )
        }),
    [advancedGoals, sessions],
  )

  const createAdvancedGoal = () => {
    if (!goalTitle.trim() || !goalDeadline) return

    onAddAdvancedGoal(
      goalTitle,
      goalTarget,
      goalDeadline,
      goalPriority,
      goalSubjectId || undefined,
    )

    setGoalTitle('')
    setGoalTarget(300)
    setGoalDeadline('')
    setGoalSubjectId('')
    setGoalPriority('medium')
  }

  const plan =
    getStudyPlan(
      sessions,
      subjects,
      weeklyGoal,
      dailyGoal,
    )

  const dailyPercent =
    Math.min(
      100,
      Math.round(
        (plan.todayCompletedMinutes /
          dailyGoal) *
          100,
      ),
    )

  const weeklyPercent =
    Math.min(
      100,
      Math.round(
        (plan.weeklyCompletedMinutes /
          weeklyGoal) *
          100,
      ),
    )

  const weeklyHours =
    Math.round(
      (plan.weeklyCompletedMinutes /
        60) *
        10,
    ) / 10

  const weeklyGoalHours =
    Math.round(weeklyGoal / 60)

  return (
    <PageContainer>
      <PageHeader
        title={t('studyPlan')}
        description={t(
          'studyPlanPageQuestion',
        )}
      />

      <div className="study-plan-v5">
        <section className="study-plan-overview">
          <article className="glass-panel study-plan-progress-card">
            <div className="study-plan-progress-head">
              <div>
                <span>Today</span>
                <strong className="mono">
                  {plan.todayCompletedMinutes}m
                  <small>
                    / {dailyGoal}m
                  </small>
                </strong>
              </div>
              <b className="mono">
                {dailyPercent}%
              </b>
            </div>

            <div className="study-plan-progress-track">
              <div
                style={{
                  width: `${dailyPercent}%`,
                }}
              />
            </div>

            <p>
              {plan.todayRemainingMinutes > 0
                ? `${plan.todayRemainingMinutes}m left to close today.`
                : 'Daily target complete. Keep the rhythm, not the pressure.'}
            </p>
          </article>

          <article className="glass-panel study-plan-progress-card">
            <div className="study-plan-progress-head">
              <div>
                <span>This week</span>
                <strong className="mono">
                  {weeklyHours}h
                  <small>
                    / {weeklyGoalHours}h
                  </small>
                </strong>
              </div>
              <b className="mono">
                {weeklyPercent}%
              </b>
            </div>

            <div className="study-plan-progress-track">
              <div
                style={{
                  width: `${weeklyPercent}%`,
                }}
              />
            </div>

            <p>
              {plan.weeklyRemainingMinutes > 0
                ? `${Math.round(
                    (plan.weeklyRemainingMinutes /
                      60) *
                      10,
                  ) / 10}h left this week.`
                : 'Weekly target complete. Protect the consistency you built.'}
            </p>
          </article>
        </section>

        <section className="glass-panel study-plan-action-panel">
          <div className="study-plan-section-head">
            <div>
              <div className="eyebrow">
                Today
              </div>
              <h2>
                The next useful work
              </h2>
            </div>

            {plan.bestTime && (
              <div className="study-plan-best-time">
                <span>Best window</span>
                <strong>
                  {plan.bestTime}
                </strong>
              </div>
            )}
          </div>

          <div className="study-plan-rationale">
            <div>
              <span>Why this plan</span>
              <strong>
                {plan.priority} priority
              </strong>
            </div>
            <p>{plan.rationale}</p>
          </div>

          <div className="study-plan-list">
            {plan.items.length === 0 ? (
              <div className="study-plan-empty">
                Add a subject and FOCUS will build the first useful plan from it.
              </div>
            ) : (
              plan.items.map(
                (item, index) => (
                  <article
                    key={`${item.subjectId}-${index}`}
                    className="study-plan-item"
                    style={
                      {
                        '--plan-subject':
                          item.subjectColor ||
                          'var(--primary-glow)',
                      } as CSSProperties
                    }
                  >
                    <div className="study-plan-item-copy">
                      <span className="study-plan-item-dot" />
                      <div>
                        <strong>
                          {item.subjectName}
                        </strong>
                        <p>
                          {item.reason}
                        </p>
                      </div>
                    </div>

                    <div className="study-plan-action">
                      <div className="study-plan-duration">
                        <strong className="mono">
                          {item.minutes}m
                        </strong>
                        {item.todayCompletedMinutes >
                          0 && (
                          <span>
                            {item.todayCompletedMinutes}m done today
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="study-plan-start"
                        onClick={() =>
                          onStartSession(
                            item.subjectId,
                            item.minutes,
                          )
                        }
                      >
                        Start focus
                      </button>
                    </div>
                  </article>
                ),
              )
            )}
          </div>
        </section>

        <section className="glass-panel study-plan-allocation-panel">
          <div className="study-plan-section-head">
            <div>
              <div className="eyebrow">
                Balance
              </div>
              <h2>
                Weekly subject allocation
              </h2>
            </div>
          </div>

          <div className="subject-allocation-grid">
            {plan.subjectAllocations.map(
              (allocation) => (
                <article
                  key={
                    allocation.subjectId
                  }
                  className="subject-allocation-card"
                  style={
                    {
                      '--allocation-color':
                        allocation.subjectColor ||
                        'var(--primary-glow)',
                    } as CSSProperties
                  }
                >
                  <div className="subject-allocation-head">
                    <div>
                      <span className="subject-allocation-dot" />
                      <strong>
                        {allocation.subjectName}
                      </strong>
                    </div>

                    <span
                      className={`subject-allocation-status ${allocation.status}`}
                    >
                      {allocation.status ===
                      'needs_attention'
                        ? 'Behind'
                        : allocation.status ===
                            'completed'
                          ? 'Done'
                          : 'On track'}
                    </span>
                  </div>

                  <div className="subject-allocation-value mono">
                    {
                      allocation.completedMinutesThisWeek
                    }
                    m
                    <small>
                      / {allocation.targetMinutes}m
                    </small>
                  </div>

                  <div className="subject-allocation-track">
                    <div
                      style={{
                        width: `${allocation.percent}%`,
                      }}
                    />
                  </div>

                  <div className="subject-allocation-footer">
                    <span>
                      {allocation.remainingMinutes >
                      0
                        ? `${allocation.remainingMinutes}m left this week`
                        : 'Target met'}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        onStartSession(
                          allocation.subjectId,
                          25,
                        )
                      }
                    >
                      25 min
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>

        <section className="glass-panel advanced-goals-panel">
          <div className="advanced-goals-header">
            <div>
              <div className="eyebrow">
                Longer horizon
              </div>
              <h2>
                Deadline goals
              </h2>
              <p>
                Give important work a clear target without turning FOCUS into a crowded task manager.
              </p>
            </div>

            <span className="mono">
              {
                advancedGoals.filter(
                  (goal) =>
                    goal.status ===
                    'active',
                ).length
              } active ·{' '}
              {
                advancedGoalCards.filter(
                  ({ progress }) =>
                    progress.overdue,
                ).length
              } overdue
            </span>
          </div>

          <div className="advanced-goal-create">
            <input
              aria-label="Goal title"
              value={goalTitle}
              maxLength={80}
              onChange={(event) =>
                setGoalTitle(
                  event.target.value,
                )
              }
              placeholder="Goal name"
            />

            <select
              aria-label="Goal subject"
              value={goalSubjectId}
              onChange={(event) =>
                setGoalSubjectId(
                  event.target.value,
                )
              }
            >
              <option value="">
                All focus sessions
              </option>
              {subjects.map(
                (subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ),
              )}
            </select>

            <input
              type="number"
              min={30}
              max={10000}
              step={30}
              value={goalTarget}
              onChange={(event) =>
                setGoalTarget(
                  Number(
                    event.target.value,
                  ),
                )
              }
              aria-label="Target minutes"
            />

            <input
              type="datetime-local"
              value={goalDeadline}
              onChange={(event) =>
                setGoalDeadline(
                  event.target.value,
                )
              }
              aria-label="Goal deadline"
            />

            <select
              aria-label="Goal priority"
              value={goalPriority}
              onChange={(event) =>
                setGoalPriority(
                  event.target
                    .value as AdvancedGoal['priority'],
                )
              }
            >
              <option value="low">
                Low priority
              </option>
              <option value="medium">
                Medium priority
              </option>
              <option value="high">
                High priority
              </option>
            </select>

            <button
              type="button"
              className="cyber-btn"
              disabled={
                !goalTitle.trim() ||
                !goalDeadline
              }
              onClick={
                createAdvancedGoal
              }
            >
              Add goal
            </button>
          </div>

          <div className="advanced-goal-list">
            {advancedGoalCards.length ===
            0 ? (
              <div className="advanced-goal-empty">
                No deadline goals yet. Add one only when a real deadline deserves its own target.
              </div>
            ) : (
              advancedGoalCards.map(
                ({ goal, progress }) => {
                  const linkedSubject =
                    goal.subjectId
                      ? subjects.find(
                          (subject) =>
                            subject.id ===
                            goal.subjectId,
                        )
                      : undefined

                  return (
                    <article
                      key={goal.id}
                      className={
                        progress.overdue
                          ? 'advanced-goal-card overdue'
                          : progress.completed
                            ? 'advanced-goal-card complete'
                            : 'advanced-goal-card'
                      }
                    >
                      <div className="advanced-goal-topline">
                        <div>
                          <span
                            className={`advanced-goal-priority ${goal.priority}`}
                          >
                            {goal.priority}
                          </span>

                          <h3>
                            {goal.title}
                          </h3>

                          <span className="advanced-goal-scope">
                            {linkedSubject
                              ? linkedSubject.name
                              : 'All focus sessions'}
                          </span>
                        </div>

                        <div className="advanced-goal-actions">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateAdvancedGoal(
                                goal.id,
                                {
                                  status:
                                    goal.status ===
                                    'completed'
                                      ? 'active'
                                      : 'completed',
                                },
                              )
                            }
                          >
                            {goal.status ===
                            'completed'
                              ? 'Reopen'
                              : 'Complete'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                pendingGoalDelete ===
                                goal.id
                              ) {
                                onDeleteAdvancedGoal(
                                  goal.id,
                                )
                                setPendingGoalDelete(
                                  null,
                                )
                                return
                              }

                              setPendingGoalDelete(
                                goal.id,
                              )
                            }}
                            onBlur={() => {
                              if (
                                pendingGoalDelete ===
                                goal.id
                              ) {
                                setPendingGoalDelete(
                                  null,
                                )
                              }
                            }}
                            aria-label={
                              pendingGoalDelete ===
                              goal.id
                                ? `Confirm deletion of ${goal.title}`
                                : `Delete ${goal.title}`
                            }
                          >
                            {pendingGoalDelete ===
                            goal.id
                              ? 'Confirm delete'
                              : 'Delete'}
                          </button>
                        </div>
                      </div>

                      <div className="advanced-goal-progress-row">
                        <span className="mono">
                          {progress.minutes}m /{' '}
                          {progress.targetMinutes}m
                        </span>
                        <span>
                          {progress.completed
                            ? 'Completed'
                            : progress.overdue
                              ? 'Overdue'
                              : `${progress.remainingMinutes}m remaining`}
                        </span>
                      </div>

                      <div className="advanced-goal-track">
                        <div
                          className="advanced-goal-fill"
                          style={{
                            width: `${progress.percent}%`,
                          }}
                        />
                      </div>

                      <div className="advanced-goal-footer">
                        <span>
                          {progress.percent}%
                        </span>
                        <span>
                          Due{' '}
                          {new Date(
                            goal.deadline,
                          ).toLocaleString()}
                        </span>

                        {linkedSubject &&
                          !progress.completed && (
                          <button
                            type="button"
                            className="advanced-goal-start"
                            onClick={() =>
                              onStartSession(
                                linkedSubject.id,
                                Math.min(
                                  60,
                                  Math.max(
                                    25,
                                    progress.remainingMinutes,
                                  ),
                                ),
                              )
                            }
                          >
                            Start focus
                          </button>
                        )}
                      </div>
                    </article>
                  )
                },
              )
            )}
          </div>
        </section>

        <section className="glass-panel planning-targets-panel">
          <div className="study-plan-section-head">
            <div>
              <div className="eyebrow">
                Targets
              </div>
              <h2>
                Planning baseline
              </h2>
              <p>
                Set the amount of focused time FOCUS should plan around.
              </p>
            </div>
          </div>

          <div className="planning-targets-grid">
            <label>
              <span>Daily focus</span>
              <select
                value={dailyGoal}
                onChange={(event) =>
                  onDailyGoalChange(
                    Number(
                      event.target.value,
                    ),
                  )
                }
              >
                <option value={30}>
                  30m / day
                </option>
                <option value={60}>
                  1h / day
                </option>
                <option value={90}>
                  1.5h / day
                </option>
                <option value={120}>
                  2h / day
                </option>
                <option value={180}>
                  3h / day
                </option>
                <option value={240}>
                  4h / day
                </option>
              </select>
            </label>

            <label>
              <span>Weekly focus</span>
              <select
                value={weeklyGoal}
                onChange={(event) =>
                  onWeeklyGoalChange(
                    Number(
                      event.target.value,
                    ),
                  )
                }
              >
                <option value={300}>
                  5h / week
                </option>
                <option value={600}>
                  10h / week
                </option>
                <option value={900}>
                  15h / week
                </option>
                <option value={1200}>
                  20h / week
                </option>
                <option value={1500}>
                  25h / week
                </option>
                <option value={1800}>
                  30h / week
                </option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
