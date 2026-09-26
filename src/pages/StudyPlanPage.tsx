import { Plus } from 'lucide-react'
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
import { localizeUiText } from '../utils/localizeUiText'
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
  onAddSubjectRequest?: () => void
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
  onAddSubjectRequest,
}: StudyPlanPageProps) {
  const { language, t, tr } = useI18n()
  const [goalTitle, setGoalTitle] = useState('')
  const [goalTarget, setGoalTarget] = useState(300)
  const [goalDeadline, setGoalDeadline] = useState('')
  const [goalSubjectId, setGoalSubjectId] = useState('')
  const [goalPriority, setGoalPriority] =
    useState<AdvancedGoal['priority']>('medium')
  const [
    showGoalAdvanced,
    setShowGoalAdvanced,
  ] = useState(false)
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
                <span>{tr('Today', 'ئەمڕۆ')}</span>
                <strong className="mono">
                  {plan.todayCompletedMinutes}
                  {language === 'ku'
                    ? ' خولەک'
                    : 'm'}
                  <small>
                    {' / '}
                    {dailyGoal}
                    {language === 'ku'
                      ? ' خولەک'
                      : 'm'}
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
                ? tr(`${plan.todayRemainingMinutes}m left to close today.`, `${plan.todayRemainingMinutes} خولەک ماوە بۆ تەواوکردنی ئەمڕۆ.`)
                : tr('Daily target complete. Keep the rhythm, not the pressure.', 'ئامانجی ڕۆژانە تەواو بوو. ڕێتمەکەت بپارێزە، نە فشارەکە.')}
            </p>
          </article>

          <article className="glass-panel study-plan-progress-card">
            <div className="study-plan-progress-head">
              <div>
                <span>{tr('This week', 'ئەم هەفتەیە')}</span>
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
                ? tr(`${Math.round(
                    (plan.weeklyRemainingMinutes /
                      60) *
                      10,
                  ) / 10}h left this week.`, `${Math.round(
                    (plan.weeklyRemainingMinutes /
                      60) *
                      10,
                  ) / 10} کاتژمێر لەم هەفتەیە ماوە.`)
                : tr('Weekly target complete. Protect the consistency you built.', 'ئامانجی هەفتانە تەواو بوو. بەردەوامییەکەی دروستت کردووە بپارێزە.')}
            </p>
          </article>
        </section>

        <section className="glass-panel study-plan-action-panel">
          <div className="study-plan-section-head">
            <div>
              <div className="eyebrow">
                {tr('Today', 'ئەمڕۆ')}
              </div>
              <h2>
                {tr('The next useful work', 'کاری بەسوودی داهاتوو')}
              </h2>
            </div>

            {plan.bestTime && (
              <div className="study-plan-best-time">
                <span>{tr('Best window', 'باشترین کات')}</span>
                <strong>
                  {plan.bestTime}
                </strong>
              </div>
            )}
          </div>

          <div className="study-plan-rationale">
            <div>
              <span>{tr('Why this plan', 'بۆچی ئەم پلانە')}</span>
              <strong>
                {plan.priority === 'high'
                  ? tr('High', 'زۆر')
                  : plan.priority === 'medium'
                    ? tr('Medium', 'ناوەند')
                    : tr('Low', 'کەم')}{' '}
                {tr('priority', 'گرنگی')}
              </strong>
            </div>
            <p>{localizeUiText(language, plan.rationale)}</p>
          </div>

          <div className="study-plan-list">
            {plan.items.length === 0 ? (
              <div className="study-plan-empty">
                {tr('Add a subject and FOCUS will build the first useful plan from it.', 'بابەتێک زیاد بکە و FOCUS یەکەم پلانی بەسوودت بۆ دروست دەکات.')}
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
                          {localizeUiText(language, item.reason)}
                        </p>
                      </div>
                    </div>

                    <div className="study-plan-action">
                      <div className="study-plan-duration">
                        <strong className="mono">
                          {item.minutes}
                          {language === 'ku'
                            ? ' خولەک'
                            : 'm'}
                        </strong>
                        {item.todayCompletedMinutes >
                          0 && (
                          <span>
                            {item.todayCompletedMinutes}
                            {language === 'ku'
                              ? ' خولەک '
                              : 'm '}
                            {tr('done today', 'ئەمڕۆ تەواو کرا')}
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
                        {tr('Start focus', 'دەستپێکردنی سەرنج')}
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
                {tr('Balance', 'هاوسەنگی')}
              </div>
              <h2>
                {tr('Weekly subject allocation', 'دابەشکردنی هەفتانەی بابەتەکان')}
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
                        ? tr('Behind', 'دواکەوتوو')
                        : allocation.status ===
                            'completed'
                          ? tr('Done', 'تەواو')
                          : tr('On track', 'لە ڕێگای دروستدایە')}
                    </span>
                  </div>

                  <div className="subject-allocation-value mono">
                    {
                      allocation.completedMinutesThisWeek
                    }
                    {language === 'ku'
                      ? ' خولەک'
                      : 'm'}
                    <small>
                      {' / '}
                      {allocation.targetMinutes}
                      {language === 'ku'
                        ? ' خولەک'
                        : 'm'}
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
                        ? tr(`${allocation.remainingMinutes}m left this week`, `${allocation.remainingMinutes} خولەک لەم هەفتەیە ماوە`)
                        : tr('Target met', 'ئامانج پێکرا')}
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
                      {tr('25 min', '٢٥ خولەک')}
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
                {tr('Longer horizon', 'ئامانجی درێژخایەن')}
              </div>
              <h2>
                {tr('Deadline goals', 'ئامانجە کاتدارەکان')}
              </h2>
              <p>
                {tr('Give important work a clear target without turning FOCUS into a crowded task manager.', 'بۆ کارە گرنگەکان ئامانجێکی ڕوون دابنێ بەبێ ئەوەی FOCUS ببێتە بەڕێوەبەری ئەرکی قەرەباڵغ.')}
              </p>
            </div>

            <span className="mono">
              {
                advancedGoals.filter(
                  (goal) =>
                    goal.status ===
                    'active',
                ).length
              } {tr('active', 'چالاک')} ·{' '}
              {
                advancedGoalCards.filter(
                  ({ progress }) =>
                    progress.overdue,
                ).length
              } {tr('overdue', 'کاتی تێپەڕیوە')}
            </span>
          </div>

          <div className="advanced-goal-create goal-create-v4">
            <input
              aria-label={tr('Goal title', 'ناوی ئامانج')}
              value={goalTitle}
              maxLength={80}
              onChange={(event) =>
                setGoalTitle(
                  event.target.value,
                )
              }
              placeholder={tr('Goal name', 'ناوی ئامانج')}
            />

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
              aria-label={tr('Target minutes', 'خولەکەکانی ئامانج')}
              placeholder={tr('Target minutes', 'خولەکی ئامانج')}
            />

            <input
              type="datetime-local"
              value={goalDeadline}
              onChange={(event) =>
                setGoalDeadline(
                  event.target.value,
                )
              }
              aria-label={tr('Goal deadline', 'کۆتا مۆڵەتی ئامانج')}
            />

            <button
              type="button"
              className="v4-advanced-toggle"
              aria-expanded={showGoalAdvanced}
              onClick={() =>
                setShowGoalAdvanced(
                  (value) => !value,
                )
              }
            >
              {showGoalAdvanced
                ? tr('Hide advanced options', 'هەڵبژاردە پێشکەوتووەکان بشارەوە')
                : tr('Advanced options', 'هەڵبژاردە پێشکەوتووەکان')}
            </button>

            {showGoalAdvanced && (
              <div className="v4-advanced-panel goal-advanced-panel">
                <label>
                  <span>
                    {tr('Subject', 'بابەت')}
                  </span>
                  <div className="v4-subject-field">
                    <select
                      aria-label={tr('Goal subject', 'بابەتی ئامانج')}
                      value={goalSubjectId}
                      onChange={(event) =>
                        setGoalSubjectId(
                          event.target.value,
                        )
                      }
                    >
                      <option value="">
                        {tr('All focus sessions', 'هەموو سێشنەکانی سەرنج')}
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

                    {onAddSubjectRequest && (
                      <button
                        type="button"
                        className="v4-add-subject"
                        onClick={onAddSubjectRequest}
                      >
                        <Plus size={14} />
                        {tr('Add subject', 'زیادکردنی بابەت')}
                      </button>
                    )}
                  </div>
                </label>

                <label>
                  <span>
                    {tr('Priority', 'گرنگی')}
                  </span>
                  <select
                    aria-label={tr('Goal priority', 'گرنگی ئامانج')}
                    value={goalPriority}
                    onChange={(event) =>
                      setGoalPriority(
                        event.target
                          .value as AdvancedGoal['priority'],
                      )
                    }
                  >
                    <option value="low">
                      {tr('Low', 'کەم')}
                    </option>
                    <option value="medium">
                      {tr('Medium', 'ناوەند')}
                    </option>
                    <option value="high">
                      {tr('High', 'زۆر')}
                    </option>
                  </select>
                </label>
              </div>
            )}

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
              {tr('Add goal', 'زیادکردنی ئامانج')}
            </button>
          </div>

          <div className="advanced-goal-list">
            {advancedGoalCards.length ===
            0 ? (
              <div className="advanced-goal-empty">
                {tr('No deadline goals yet. Add one only when a real deadline deserves its own target.', 'هێشتا ئامانجی کاتدار نییە. تەنها کاتێک زیاد بکە کە بەڕاستی پێویستی بە کاتی دیاریکراو هەیە.')}
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
                            {goal.priority === 'high' ? tr('High', 'زۆر') : goal.priority === 'medium' ? tr('Medium', 'ناوەند') : tr('Low', 'کەم')}
                          </span>

                          <h3>
                            {goal.title}
                          </h3>

                          <span className="advanced-goal-scope">
                            {linkedSubject
                              ? linkedSubject.name
                              : tr('All focus sessions', 'هەموو سێشنەکانی سەرنج')}
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
                              ? tr('Reopen', 'کردنەوە')
                               : tr('Complete', 'تەواو')}
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
                                ? `${tr('Confirm deletion of', 'پشتڕاستکردنەوەی سڕینەوەی')} ${goal.title}`
                                : `${tr('Delete', 'سڕینەوەی')} ${goal.title}`
                            }
                          >
                            {pendingGoalDelete ===
                            goal.id
                              ? tr('Confirm delete', 'پشتڕاستکردنەوەی سڕینەوە')
                               : tr('Delete', 'سڕینەوە')}
                          </button>
                        </div>
                      </div>

                      <div className="advanced-goal-progress-row">
                        <span className="mono">
                          {progress.minutes}
                          {language === 'ku'
                            ? ' خولەک'
                            : 'm'}{' / '}
                          {progress.targetMinutes}
                          {language === 'ku'
                            ? ' خولەک'
                            : 'm'}
                        </span>
                        <span>
                          {progress.completed
                            ? tr('Completed', 'تەواوکراو')
                             : progress.overdue
                              ? tr('Overdue', 'کاتی تێپەڕیوە')
                              : tr(`${progress.remainingMinutes}m remaining`, `${progress.remainingMinutes} خولەک ماوە`)}
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
                          {tr('Due', 'کۆتا مۆڵەت')}{' '}
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
                            {tr('Start focus', 'دەستپێکردنی سەرنج')}
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
                {tr('Targets', 'ئامانجەکان')}
              </div>
              <h2>
                {tr('Planning baseline', 'بنەمای پلان')}
              </h2>
              <p>
                {tr('Set the amount of focused time FOCUS should plan around.', 'بڕی کاتی سەرنج دیاری بکە کە FOCUS پلانی لەسەر بنیات بنێت.')}
              </p>
            </div>
          </div>

          <div className="planning-targets-grid">
            <label>
              <span>{tr('Daily focus', 'سەرنجی ڕۆژانە')}</span>
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
                  {tr('30m / day', '٣٠ خولەک / ڕۆژ')}
                </option>
                <option value={60}>
                  {tr('1h / day', '١ کاتژمێر / ڕۆژ')}
                </option>
                <option value={90}>
                  {tr('1.5h / day', '١.٥ کاتژمێر / ڕۆژ')}
                </option>
                <option value={120}>
                  {tr('2h / day', '٢ کاتژمێر / ڕۆژ')}
                </option>
                <option value={180}>
                  {tr('3h / day', '٣ کاتژمێر / ڕۆژ')}
                </option>
                <option value={240}>
                  {tr('4h / day', '٤ کاتژمێر / ڕۆژ')}
                </option>
              </select>
            </label>

            <label>
              <span>{tr('Weekly focus', 'سەرنجی هەفتانە')}</span>
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
                  {tr('5h / week', '٥ کاتژمێر / هەفتە')}
                </option>
                <option value={600}>
                  {tr('10h / week', '١٠ کاتژمێر / هەفتە')}
                </option>
                <option value={900}>
                  {tr('15h / week', '١٥ کاتژمێر / هەفتە')}
                </option>
                <option value={1200}>
                  {tr('20h / week', '٢٠ کاتژمێر / هەفتە')}
                </option>
                <option value={1500}>
                  {tr('25h / week', '٢٥ کاتژمێر / هەفتە')}
                </option>
                <option value={1800}>
                  {tr('30h / week', '٣٠ کاتژمێر / هەفتە')}
                </option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
