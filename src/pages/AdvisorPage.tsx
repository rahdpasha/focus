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
        description="Ask one question. Get one evidence-based next action."
      />

      <div className="advisor-shell">
        <section
          className="glass-panel advisor-hero"
          aria-busy={loading}
        >
          <div
            style={{
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div className="focus-pulse-kicker">
              <BrainCircuit
                size={16}
              />
              Study intelligence
            </div>

            <h2
              style={{
                margin:
                  '12px 0 8px',
                fontSize:
                  'clamp(22px, 3vw, 34px)',
                color:
                  'var(--text-primary)',
                lineHeight: 1.15,
              }}
            >
              Ask about your actual
              study behavior.
            </h2>

            <p
              style={{
                margin: 0,
                maxWidth:
                  '720px',
                color:
                  'var(--text-secondary)',
                fontSize:
                  '13px',
                lineHeight: 1.65,
              }}
            >
              FOCUS calculates the
              facts first. AI only
              interprets those facts;
              it does not invent your
              statistics.
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
                  ? 'ANALYZING...'
                  : 'ASK FOCUS'}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  marginTop:
                    '14px',
                  color:
                    'var(--danger)',
                  fontSize:
                    '12px',
                }}
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
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '8px',
                    color:
                      response.source ===
                      'ai'
                        ? 'var(--primary-glow)'
                        : 'var(--energy)',
                    fontSize:
                      '10px',
                    fontWeight:
                      700,
                    textTransform:
                      'uppercase',
                    letterSpacing:
                      '0.08em',
                  }}
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

        <aside
          style={{
            display: 'grid',
            gap: '16px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: '8px',
                color:
                  'var(--text-primary)',
                fontWeight: 700,
                marginBottom:
                  '14px',
              }}
            >
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

            <p
              style={{
                margin:
                  '14px 0 0',
                color:
                  'var(--text-muted)',
                fontSize:
                  '10px',
                lineHeight: 1.55,
              }}
            >
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
