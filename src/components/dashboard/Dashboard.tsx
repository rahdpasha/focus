import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Plus,
} from 'lucide-react'
import type {
  Subject,
  StudySession,
} from '../../types'
import type {
  RoutineItem,
  RoutineSessionContext,
} from '../../storage/types'
import FocusPulse from './FocusPulse'
import {
  getStudyPlan,
} from '../../utils/studyPlan'
import { useI18n } from '../../useI18n'
import { localizeUiText } from '../../utils/localizeUiText'
import {
  getRotationItemForDate,
  getRoutineItemsForDate,
  getRoutineMinutesForDate,
  toRoutineDateKey,
} from '../../utils/routine'

interface DashboardProps {
  subjects: Subject[]
  sessions: StudySession[]
  dailyGoal: number
  weeklyGoal: number
  routineItems: RoutineItem[]
  onStartRecommendedSession: (
    subjectId?: string,
    minutes?: number,
    routineContext?: RoutineSessionContext,
  ) => void
  onAddSubjectRequest?: () => void
}

export default function Dashboard({
  subjects,
  sessions,
  dailyGoal,
  weeklyGoal,
  routineItems,
  onStartRecommendedSession,
  onAddSubjectRequest,
}: DashboardProps) {
  const { language, tr } = useI18n()
  const now = new Date()

  const plan =
    getStudyPlan(
      sessions,
      subjects,
      weeklyGoal,
      dailyGoal,
    )

  const todaysRoutine =
    getRoutineItemsForDate(
      routineItems,
      now,
    )

  const todaysRotation =
    getRotationItemForDate(
      routineItems,
      now,
    )

  const routineCompleted =
    todaysRoutine.filter(
      (item) =>
        getRoutineMinutesForDate(
          item,
          sessions,
          now,
        ) >= item.targetMinutes,
    ).length

  const routinePreview =
    todaysRoutine.slice(0, 4)

  const hiddenRoutineCount =
    Math.max(
      0,
      todaysRoutine.length -
        routinePreview.length,
    )

  return (
    <main className="dashboard dashboard-v3 dashboard-v4">
      <header className="dashboard-v3-header dashboard-v4-header">
        <div>
          <div className="eyebrow">
            {tr('Today', 'ئەمڕۆ')}
          </div>
          <h1>
            {tr(
              'One clear move at a time.',
              'هەر جار هەنگاوێکی ڕوون.',
            )}
          </h1>
          <p>
            {tr(
              'Start what matters now. The rest can wait.',
              'ئەوەی ئێستا گرنگە دەست پێ بکە. ئەوانی تر دەتوانن چاوەڕێ بکەن.',
            )}
          </p>
        </div>

        <div className="dashboard-date">
          <CalendarDays size={15} />
          {now.toLocaleDateString(
            language === 'ku'
              ? 'ku-IQ'
              : 'en-US',
            {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            },
          )}
        </div>
      </header>

      {subjects.length === 0 ? (
        <section className="glass-panel dashboard-first-subject">
          <div className="dashboard-first-subject-icon">
            <BookOpen size={22} />
          </div>

          <div className="dashboard-first-subject-copy">
            <div className="eyebrow">
              {tr('Set up FOCUS', 'FOCUS ئامادە بکە')}
            </div>
            <h2>
              {tr(
                'Start with your first subject.',
                'بە یەکەم بابەتت دەست پێ بکە.',
              )}
            </h2>
            <p>
              {tr(
                'Add a subject once. Then Today can build your next move, Focus can save sessions, and Progress can track your work.',
                'یەک جار بابەتێک زیاد بکە. پاشان ئەمڕۆ هەنگاوی داهاتووت دروست دەکات، سەرنج سێشنەکان پاشەکەوت دەکات و پێشکەوتن کارت بەدواداچوون دەکات.',
              )}
            </p>
          </div>

          {onAddSubjectRequest && (
            <button
              type="button"
              className="cyber-btn"
              onClick={onAddSubjectRequest}
            >
              <Plus size={15} />
              {tr(
                'Add subject',
                'زیادکردنی بابەت',
              )}
            </button>
          )}
        </section>
      ) : (
        <>
      <FocusPulse
        sessions={sessions}
        subjects={subjects}
        dailyGoal={dailyGoal}
        weeklyGoal={weeklyGoal}
        onStart={
          onStartRecommendedSession
        }
      />

      <div className="dashboard-v4-lower">
      <section className="glass-panel dashboard-routine-preview dashboard-v4-section">
        <div className="dashboard-section-head dashboard-routine-head">
          <div>
            <div className="eyebrow">
              {tr(
                "Today's routine",
                'ڕوتینی ئەمڕۆ',
              )}
            </div>
            <h2>
              {todaysRoutine.length === 0
                ? tr(
                    'Nothing scheduled',
                    'هیچ شتێک پلان نەکراوە',
                  )
                : `${routineCompleted}/${todaysRoutine.length} ${tr('complete', 'تەواو')}`}
            </h2>
          </div>

          {todaysRotation && (
            <span className="mono">
              {tr(
                'Rotation',
                'گۆڕانکاری',
              )} · {todaysRotation.title}
            </span>
          )}
        </div>

        {todaysRoutine.length === 0 ? (
          <div className="dashboard-empty">
            {tr(
              'Your day is clear. Add a routine only when you need one.',
              'ڕۆژەکەت بەتاڵە. تەنها کاتێک پێویستە ڕوتین زیاد بکە.',
            )}
          </div>
        ) : (
          <div className="dashboard-routine-grid">
            {routinePreview.map(
              (item) => {
                const subject =
                  subjects.find(
                    (candidate) =>
                      candidate.id ===
                      item.subjectId,
                  )

                const minutes =
                  getRoutineMinutesForDate(
                    item,
                    sessions,
                    now,
                  )

                const done =
                  minutes >=
                  item.targetMinutes

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!subject}
                    onClick={() =>
                      onStartRecommendedSession(
                        item.subjectId,
                        item.targetMinutes,
                        {
                          itemId: item.id,
                          routineDate:
                            toRoutineDateKey(
                              now,
                            ),
                        },
                      )
                    }
                    className="dashboard-routine-card"
                  >
                    <span
                      aria-label={
                        done
                          ? tr(
                              'Completed',
                              'تەواوکراو',
                            )
                          : tr(
                              'Pending',
                              'چاوەڕوان',
                            )
                      }
                      className={`dashboard-routine-state ${done ? 'done' : ''}`}
                    >
                      {done ? '✓' : ''}
                    </span>

                    <span className="dashboard-routine-copy">
                      <strong>
                        {item.title}
                      </strong>
                      <small>
                        {minutes}/
                        {item.targetMinutes}
                        {language === 'ku'
                          ? ' خولەک'
                          : 'm'}
                      </small>
                    </span>
                  </button>
                )
              },
            )}

            {hiddenRoutineCount > 0 && (
              <div className="dashboard-routine-more">
                +{hiddenRoutineCount}{' '}
                {tr(
                  'more',
                  'زیاتر',
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="glass-panel dashboard-route dashboard-v4-section">
        <div className="dashboard-section-head">
          <div>
            <div className="eyebrow">
              {tr(
                'Next up',
                'داهاتوو',
              )}
            </div>
            <h2>
              {tr(
                'Your next study blocks',
                'بڵۆکەکانی خوێندنی داهاتووت',
              )}
            </h2>
          </div>

          <span className="mono">
            {plan.totalPlannedTodayMinutes}
            {language === 'ku'
              ? ' خولەک'
              : 'm'}
          </span>
        </div>

        <div className="dashboard-route-list">
          {plan.items.length === 0 ? (
            <div className="dashboard-empty">
              {tr(
                'Add a subject when you are ready to build a plan.',
                'کاتێک ئامادە بوویت بابەتێک زیاد بکە بۆ دروستکردنی پلان.',
              )}
            </div>
          ) : (
            plan.items
              .slice(0, 3)
              .map(
                (
                  item,
                  index,
                ) => (
                  <article
                    key={
                      item.subjectId +
                      index
                    }
                    className="dashboard-route-item"
                  >
                    <div
                      className="dashboard-route-index"
                      style={{
                        borderColor:
                          item.subjectColor ??
                          'var(--primary-border)',
                        color:
                          item.subjectColor ??
                          'var(--primary-glow)',
                      }}
                    >
                      {index + 1}
                    </div>

                    <div className="dashboard-route-copy">
                      <strong>
                        {item.subjectName}
                      </strong>
                      <span>
                        {localizeUiText(
                          language,
                          item.reason,
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="dashboard-route-action"
                      onClick={() =>
                        onStartRecommendedSession(
                          item.subjectId,
                          item.minutes,
                        )
                      }
                    >
                      {item.minutes}m
                      <ArrowRight
                        size={14}
                      />
                    </button>
                  </article>
                ),
              )
          )}
        </div>
      </section>
      </div>
        </>
      )}
    </main>
  )
}
