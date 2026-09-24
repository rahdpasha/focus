import {
  Activity,
  BrainCircuit,
  CalendarCheck2,
  CheckCircle2,
  Layers3,
  Zap,
} from 'lucide-react'
import type {
  StudySession,
} from '../../types'
import {
  getAdvancedAnalytics,
} from '../../utils/advancedAnalytics'

interface AdvancedInsightsProps {
  sessions: StudySession[]
}

function signedPercent(
  value: number,
): string {
  return value > 0
    ? `+${value}%`
    : `${value}%`
}

export default function AdvancedInsights({
  sessions,
}: AdvancedInsightsProps) {
  const analytics =
    getAdvancedAnalytics(
      sessions,
    )

  return (
    <section className="glass-panel analytics-v3">
      <div className="analytics-v3-header">
        <div>
          <div className="focus-pulse-kicker">
            <BrainCircuit
              size={15}
            />
            Advanced analytics
          </div>

          <h2>
            {
              analytics.headline
            }
          </h2>

          <p>
            Last 30 days for quality
            signals · last 7 days for
            momentum.
          </p>
        </div>

        <div className="quality-orb">
          <span>
            Focus quality
          </span>
          <strong>
            {
              analytics.qualityScore
            }
          </strong>
          <small>
            {
              analytics.qualityLabel
            }
          </small>
        </div>
      </div>

      <div className="analytics-v3-grid">
        <article className="analytics-v3-card">
          <div>
            <Activity size={16} />
            Momentum
          </div>
          <strong>
            {signedPercent(
              analytics.momentumPercent,
            )}
          </strong>
          <span>
            {analytics.current7Minutes}m
            this 7d vs{' '}
            {analytics.previous7Minutes}m
          </span>
        </article>

        <article className="analytics-v3-card">
          <div>
            <CalendarCheck2
              size={16}
            />
            Active days
          </div>
          <strong>
            {
              analytics.current7ActiveDays
            }
            /7
          </strong>
          <span>
            Previous 7d:{' '}
            {
              analytics.previous7ActiveDays
            }
          </span>
        </article>

        <article className="analytics-v3-card">
          <div>
            <CheckCircle2
              size={16}
            />
            Completion
          </div>
          <strong>
            {
              analytics.completionRate
            }
            %
          </strong>
          <span>
            Completed vs ended
            sessions
          </span>
        </article>

        <article className="analytics-v3-card">
          <div>
            <Zap size={16} />
            Interruptions
          </div>
          <strong>
            {
              analytics.averageInterruptions
            }
          </strong>
          <span>
            Average per completed
            session
          </span>
        </article>

        <article className="analytics-v3-card">
          <div>
            <Layers3 size={16} />
            Deep work
          </div>
          <strong>
            {
              analytics.deepWorkRatio
            }
            %
          </strong>
          <span>
            Time inside 45m+
            sessions
          </span>
        </article>

        <article className="analytics-v3-card">
          <div>
            <BrainCircuit
              size={16}
            />
            Checklist
          </div>
          <strong>
            {analytics
              .checklistCompletion ===
            null
              ? '—'
              : `${analytics.checklistCompletion}%`}
          </strong>
          <span>
            {analytics
              .checklistCompletion ===
            null
              ? 'Use session checklists to unlock'
              : 'Average task completion'}
          </span>
        </article>
      </div>

      <div className="analytics-v3-footer">
        <div>
          <span>
            Strongest weekday
          </span>
          <strong>
            {analytics.strongestWeekday ??
              'Still learning'}
          </strong>
        </div>

        <div>
          <span>
            Focus on that day
          </span>
          <strong>
            {
              analytics.strongestWeekdayMinutes
            }
            m
          </strong>
        </div>

        <p>
          Quality index blends
          completion, interruptions,
          deep-work share and
          checklist follow-through.
          It is a behavioral signal,
          not a grade.
        </p>
      </div>
    </section>
  )
}
