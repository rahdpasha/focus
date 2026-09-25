import {
  useMemo,
  useState,
} from 'react'
import {
  ArrowRight,
  BrainCircuit,
  LockKeyhole,
  Sparkles,
} from 'lucide-react'
import type {
  Subject,
  StudySession,
} from '../types'
import type {
  AdvancedGoal,
} from '../storage/types'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'
import {
  buildAdvisorContext,
} from '../ai/advisorContext'
import {
  askStudyAdvisor,
  type AiAdvisorResponse,
} from '../ai/advisorClient'

interface AdvisorPageProps {
  sessions: StudySession[]
  subjects: Subject[]
  dailyGoal: number
  weeklyGoal: number
  advancedGoals: AdvancedGoal[]
  onStartSession: (
    subjectId?: string,
    minutes?: number,
  ) => void
}

const quickPrompts = [
  'What should I study now?',
  'What is hurting my consistency?',
  'How should I use 45 minutes?',
  'What am I neglecting this week?',
]

export default function AdvisorPage({
  sessions,
  subjects,
  dailyGoal,
  weeklyGoal,
  advancedGoals,
  onStartSession,
}: AdvisorPageProps) {
  const [question, setQuestion] =
    useState(
      'What should I study now?',
    )
  const [response, setResponse] =
    useState<AiAdvisorResponse | null>(
      null,
    )
  const [loading, setLoading] =
    useState(false)
  const [error, setError] =
    useState('')

  const context = useMemo(
    () =>
      buildAdvisorContext(
        sessions,
        subjects,
        dailyGoal,
        weeklyGoal,
        advancedGoals,
      ),
    [
      advancedGoals,
      dailyGoal,
      sessions,
      subjects,
      weeklyGoal,
    ],
  )

  const ask = async () => {
    if (!question.trim()) return

    setLoading(true)
    setError('')

    try {
      const next =
        await askStudyAdvisor(
          question,
          context,
        )

      setResponse(next)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The advisor could not answer right now.',
      )
    } finally {
      setLoading(false)
    }
  }

  const startAction = () => {
    if (!response) return

    const validSubjectId =
      response.action
        .subjectId &&
      subjects.some(
        (subject) =>
          subject.id ===
          response.action
            .subjectId,
      )
        ? response.action
            .subjectId
        : context
            .deterministicRecommendation
            .subjectId

    onStartSession(
      validSubjectId,
      response.action.minutes,
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="FOCUS Advisor"
        description="Ask about your study pattern and get one clear next action grounded in your own data."
      />

      <div className="advisor-shell">
        <section
          className="glass-panel advisor-hero"
          aria-busy={loading}
        >
          <div className="advisor-v5-main">
            <div className="focus-pulse-kicker">
              <BrainCircuit
                size={16}
              />
              Study intelligence
            </div>

            <h2>
              Turn your study pattern into a next move.
            </h2>

            <p className="advisor-v5-intro">
              FOCUS starts with your real study data, then turns the pattern into one practical recommendation.
            </p>

            <div className="advisor-form">
              <div className="advisor-quick-prompts">
                {quickPrompts.map(
                  (prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() =>
                        setQuestion(
                          prompt,
                        )
                      }
                    >
                      {prompt}
                    </button>
                  ),
                )}
              </div>

              <textarea
                aria-label="Ask the FOCUS Advisor"
                value={question}
                maxLength={500}
                onChange={(
                  event,
                ) =>
                  setQuestion(
                    event.target
                      .value,
                  )
                }
                placeholder="Ask FOCUS about your next session, consistency, balance, or week."
              />

              <button
                type="button"
                className="cyber-btn"
                disabled={
                  loading ||
                  !question.trim()
                }
                onClick={() =>
                  void ask()
                }
              >
                {loading
                  ? 'Analyzing…'
                  : 'Ask FOCUS'}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="advisor-v5-error"
              >
                {error}
              </div>
            )}

            {response && (
              <div
                className="advisor-answer"
                role="status"
                aria-live="polite"
              >
                <div
                  className={
                    response.source === 'ai'
                      ? 'advisor-v5-source ai'
                      : 'advisor-v5-source local'
                  }
                >
                  <Sparkles
                    size={14}
                  />
                  {response.source ===
                  'ai'
                    ? 'AI analysis'
                    : 'Smart local fallback'}
                </div>

                <h3>
                  {
                    response.headline
                  }
                </h3>

                <p>
                  {response.answer}
                </p>

                <ul className="advisor-reasons">
                  {response.reasons.map(
                    (
                      reason,
                      index,
                    ) => (
                      <li
                        key={
                          reason +
                          index
                        }
                      >
                        {reason}
                      </li>
                    ),
                  )}
                </ul>

                <button
                  type="button"
                  className="focus-pulse-action"
                  onClick={
                    startAction
                  }
                >
                  Start{' '}
                  {
                    response.action
                      .minutes
                  }
                  m
                  {response.action
                    .subjectName
                    ? ` · ${response.action.subjectName}`
                    : ''}
                  <ArrowRight
                    size={16}
                  />
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="advisor-v5-side">
          <div className="glass-panel advisor-v5-facts-card">
            <div className="advisor-v5-facts-title">
              <LockKeyhole
                size={17}
              />
              Facts sent for analysis
            </div>

            <div className="advisor-facts">
              <div className="advisor-fact">
                <span>Today</span>
                <strong>
                  {
                    context.today
                      .minutes
                  }
                  /
                  {
                    context.today
                      .goalMinutes
                  }
                  m
                </strong>
              </div>

              <div className="advisor-fact">
                <span>
                  This week
                </span>
                <strong>
                  {
                    context.week
                      .minutes
                  }
                  /
                  {
                    context.week
                      .goalMinutes
                  }
                  m ·{' '}
                  {
                    context.week
                      .studyDays
                  }{' '}
                  days
                </strong>
              </div>

              <div className="advisor-fact">
                <span>
                  Last 30 days
                </span>
                <strong>
                  {
                    context.periods
                      .last30.minutes
                  }
                  m ·{' '}
                  {
                    context.periods
                      .last30.activeDays
                  }{' '}
                  active days
                </strong>
              </div>

              <div className="advisor-fact">
                <span>
                  Consistency
                </span>
                <strong>
                  {
                    context
                      .consistency
                      .trend
                  }
                </strong>
              </div>

              <div className="advisor-fact">
                <span>
                  Active goals
                </span>
                <strong>
                  {
                    context.advancedGoals.filter(
                      (goal) =>
                        goal.status === 'active',
                    ).length
                  }
                </strong>
              </div>

              <div className="advisor-fact">
                <span>
                  Best window
                </span>
                <strong>
                  {context.bestStudyTime ??
                    'Still learning'}
                </strong>
              </div>
            </div>

            <p className="advisor-v5-privacy">
              Raw session notes are
              not sent. The advisor
              receives summarized
              study facts and recent
              session metrics only,
              and only when you press
              Ask FOCUS.
            </p>
          </div>
        </aside>
      </div>
    </PageContainer>
  )
}
