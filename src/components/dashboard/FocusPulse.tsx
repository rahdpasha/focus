import {
  ArrowRight,
  BrainCircuit,
  Clock3,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type {
  Subject,
  StudySession,
} from '../../types'
import {
  getFocusPulse,
} from '../../utils/focusPulse'
import { useI18n } from '../../useI18n'

interface FocusPulseProps {
  sessions: StudySession[]
  subjects: Subject[]
  dailyGoal: number
  weeklyGoal: number
  onStart: (
    subjectId?: string,
    minutes?: number,
  ) => void
}

function trendIcon(
  trend:
    | 'improving'
    | 'declining'
    | 'stable',
) {
  if (trend === 'improving') {
    return <TrendingUp size={15} />
  }

  if (trend === 'declining') {
    return <TrendingDown size={15} />
  }

  return <Target size={15} />
}

export default function FocusPulse({
  sessions,
  subjects,
  dailyGoal,
  weeklyGoal,
  onStart,
}: FocusPulseProps) {
  const { tr } = useI18n()
  const pulse = getFocusPulse(
    sessions,
    subjects,
    dailyGoal,
    weeklyGoal,
  )

  return (
    <section className="focus-pulse glass-panel">
      <div className="focus-pulse-main">
        <div className="focus-pulse-kicker">
          <BrainCircuit size={16} />
          {tr('FOCUS Pulse', 'پەڵسی FOCUS')}
        </div>

        <h2 className="focus-pulse-headline">
          {pulse.headline}
        </h2>

        <p className="focus-pulse-summary">
          {pulse.summary}
        </p>

        <div className="focus-pulse-evidence">
          {pulse.evidence.map(
            (item) => (
              <span
                key={item}
                className="focus-pulse-chip"
              >
                {item}
              </span>
            ),
          )}
        </div>

        <button
          type="button"
          className="focus-pulse-action"
          onClick={() =>
            onStart(
              pulse.action
                .subjectId,
              pulse.action
                .minutes,
            )
          }
        >
          {pulse.action.label}
          <ArrowRight
            size={16}
          />
        </button>
      </div>

      <div className="focus-pulse-side">
        <div className="focus-pulse-meter">
          <div className="focus-pulse-meter-row">
            <span>{tr('Today', 'ئەمڕۆ')}</span>
            <strong>
              {pulse.todayMinutes}/
              {pulse.dailyGoal}m
            </strong>
          </div>

          <div className="focus-pulse-track">
            <div
              className="focus-pulse-fill"
              style={{
                width: `${pulse.dailyProgress}%`,
              }}
            />
          </div>
        </div>

        <div className="focus-pulse-meter">
          <div className="focus-pulse-meter-row">
            <span>{tr('This week', 'ئەم هەفتەیە')}</span>
            <strong>
              {pulse.weeklyMinutes}/
              {pulse.weeklyGoal}m
            </strong>
          </div>

          <div className="focus-pulse-track">
            <div
              className="focus-pulse-fill secondary"
              style={{
                width: `${pulse.weeklyProgress}%`,
              }}
            />
          </div>
        </div>

        <div className="focus-pulse-mini-grid">
          <div className="focus-pulse-mini">
            <div>
              {trendIcon(
                pulse.consistencyTrend,
              )}
              {tr('Rhythm', 'ڕێتم')}
            </div>
            <strong>
              {tr(
                pulse.consistencyTrend,
                pulse.consistencyTrend === 'improving'
                  ? 'باشتر دەبێت'
                  : pulse.consistencyTrend === 'declining'
                    ? 'خراپتر دەبێت'
                    : 'جێگیرە',
              )}
            </strong>
          </div>

          <div className="focus-pulse-mini">
            <div>
              <Clock3 size={15} />
              {tr('Best window', 'باشترین کات')}
            </div>
            <strong>
              {pulse.bestTime ??
                tr('Learning', 'هێشتا فێر دەبێت')}
            </strong>
          </div>
        </div>
      </div>
    </section>
  )
}
