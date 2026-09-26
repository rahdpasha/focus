import {
  BarChart3,
  History as HistoryIcon,
  TimerReset,
  Trophy,
} from 'lucide-react'
import {
  lazy,
  Suspense,
  useState,
} from 'react'
import type {
  StudySession,
} from '../types'
import type {
  WeeklyGoalMap,
} from '../utils/goalHistory'
import { useI18n } from '../useI18n'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'
import RecordsPage from './RecordsPage'
import HistoryPage from './HistoryPage'

const Statistics = lazy(
  () =>
    import(
      '../components/statistics/Statistics'
    ),
)

type ProgressSection =
  | 'overview'
  | 'records'
  | 'history'

interface ProgressPageProps {
  sessions: StudySession[]
  weeklyGoal: number
  weeklyGoalsHistory: WeeklyGoalMap
  onStartFocus: () => void
}

export default function ProgressPage({
  sessions,
  weeklyGoal,
  weeklyGoalsHistory,
  onStartFocus,
}: ProgressPageProps) {
  const { tr } = useI18n()
  const [
    section,
    setSection,
  ] = useState<ProgressSection>(
    'overview',
  )

  const tabs = [
    {
      id: 'overview' as const,
      label: tr(
        'Overview',
        'پوختە',
      ),
      icon: BarChart3,
    },
    {
      id: 'records' as const,
      label: tr(
        'Records',
        'تۆمارەکان',
      ),
      icon: Trophy,
    },
    {
      id: 'history' as const,
      label: tr(
        'History',
        'مێژوو',
      ),
      icon: HistoryIcon,
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title={tr(
          'Progress',
          'پێشکەوتن',
        )}
        description={tr(
          'See how you are doing, what you have achieved, and where your time went — all in one place.',
          'بزانە چۆن پێش دەکەویت، چی بەدەست هێناوە و کاتت بۆ کوێ چووە ـ هەمووی لە یەک شوێندا.',
        )}
      />

      {sessions.length === 0 ? (
        <section className="glass-panel progress-first-session">
          <div className="progress-first-session-icon">
            <TimerReset size={22} />
          </div>

          <div className="progress-first-session-copy">
            <div className="eyebrow">
              {tr('First progress', 'یەکەم پێشکەوتن')}
            </div>
            <h2>
              {tr(
                'Complete your first Focus session.',
                'یەکەم سێشنی سەرنجت تەواو بکە.',
              )}
            </h2>
            <p>
              {tr(
                'After one saved session, FOCUS will show your overview, records, and history here.',
                'دوای یەک سێشنی پاشەکەوتکراو، FOCUS پوختە، تۆمار و مێژووت لێرە پیشان دەدات.',
              )}
            </p>
          </div>

          <button
            type="button"
            className="cyber-btn"
            onClick={onStartFocus}
          >
            <TimerReset size={15} />
            {tr('Start focus', 'دەستپێکردنی سەرنج')}
          </button>
        </section>
      ) : (
        <>
      <nav
        className="progress-v4-tabs"
        aria-label={tr(
          'Progress sections',
          'بەشەکانی پێشکەوتن',
        )}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active =
            section === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              className={
                active
                  ? 'progress-v4-tab active'
                  : 'progress-v4-tab'
              }
              onClick={() =>
                setSection(tab.id)
              }
              aria-current={
                active
                  ? 'page'
                  : undefined
              }
            >
              <Icon size={16} />
              <span>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="progress-v4-body">
        {section ===
          'overview' && (
          <Suspense
            fallback={
              <div className="glass-panel progress-v4-loading">
                {tr(
                  'Loading progress…',
                  'پێشکەوتن بار دەکرێت…',
                )}
              </div>
            }
          >
            <Statistics
              sessions={sessions}
              weeklyGoal={
                weeklyGoal
              }
              weeklyGoalsHistory={
                weeklyGoalsHistory
              }
            />
          </Suspense>
        )}

        {section ===
          'records' && (
          <RecordsPage
            sessions={sessions}
            weeklyGoal={
              weeklyGoal
            }
          />
        )}

        {section ===
          'history' && (
          <HistoryPage
            sessions={sessions}
          />
        )}
      </div>
        </>
      )}
    </PageContainer>
  )
}
