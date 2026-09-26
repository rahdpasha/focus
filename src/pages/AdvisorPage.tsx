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
import { useI18n } from '../useI18n'
import { localizeUiText } from '../utils/localizeUiText'
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

export default function AdvisorPage({
  sessions,
  subjects,
  dailyGoal,
  weeklyGoal,
  advancedGoals,
  onStartSession,
}: AdvisorPageProps) {
  const { language, tr } = useI18n()
  const quickPrompts = [
    tr('What should I study now?', 'ئێستا چی بخوێنم؟'),
    tr('What is hurting my consistency?', 'چی بەردەوامییەکەم لاواز دەکات؟'),
    tr('How should I use 45 minutes?', 'چۆن ٤٥ خولەک بەکاربهێنم؟'),
    tr('What am I neglecting this week?', 'ئەم هەفتەیە چی پشتگوێ دەخەم؟'),
  ]

  const [question, setQuestion] =
    useState(
      tr('What should I study now?', 'ئێستا چی بخوێنم؟'),
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
          : tr('The advisor could not answer right now.', 'ڕاوێژکارەکە ئێستا ناتوانێت وەڵام بدات.'),
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
        title={tr('FOCUS Advisor', 'ڕاوێژکاری FOCUS')}
        description={tr('Ask about your study pattern and get one clear next action grounded in your own data.', 'دەربارەی شێوازی خوێندنت بپرسە و یەک هەنگاوی داهاتووی ڕوون لەسەر بنەمای داتای خۆت وەربگرە.')}
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
              {tr('Study intelligence', 'زیرەکی خوێندن')}
            </div>

            <h2>
              {tr('Turn your study pattern into a next move.', 'شێوازی خوێندنت بگۆڕە بە هەنگاوی داهاتوو.')}
            </h2>

            <p className="advisor-v5-intro">
              {tr('FOCUS starts with your real study data, then turns the pattern into one practical recommendation.', 'FOCUS لە داتای ڕاستەقینەی خوێندنتەوە دەست پێ دەکات و دواتر بە یەک پێشنیاری کرداری دەیگۆڕێت.')}
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
                aria-label={tr('Ask the FOCUS Advisor', 'لە ڕاوێژکاری FOCUS بپرسە')}
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
                placeholder={tr('Ask FOCUS about your next session, consistency, balance, or week.', 'لە FOCUS دەربارەی سێشنی داهاتوو، بەردەوامی، هاوسەنگی یان هەفتەکەت بپرسە.')}
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
                  ? tr('Analyzing…', 'شیکردنەوە دەکرێت…')
                  : tr('Ask FOCUS', 'لە FOCUS بپرسە')}
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
                    ? tr('AI analysis', 'شیکردنەوەی AI')
                    : tr('Smart local fallback', 'جێگرەوەی زیرەکی ناوخۆیی')}
                </div>

                <h3>
                  {
                    localizeUiText(language, response.headline)
                  }
                </h3>

                <p>
                  {localizeUiText(language, response.answer)}
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
                        {localizeUiText(language, reason)}
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
                  {tr('Start', 'دەست پێ بکە')}{' '}
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

        <details className="glass-panel advisor-v4-details">
          <summary>
            <span>
              <LockKeyhole size={16} />
              {tr('What FOCUS uses', 'FOCUS چی بەکاردەهێنێت')}
            </span>
            <small>
              {tr('Your study summary only', 'تەنها پوختەی خوێندنت')}
            </small>
          </summary>

          <div className="advisor-v5-facts-card">
            <div className="advisor-v5-facts-title">
              <LockKeyhole
                size={17}
              />
              {tr('Facts sent for analysis', 'زانیارییە نێردراوەکان بۆ شیکردنەوە')}
            </div>

            <div className="advisor-facts">
              <div className="advisor-fact">
                <span>{tr('Today', 'ئەمڕۆ')}</span>
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
                  {tr('This week', 'ئەم هەفتەیە')}
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
                  {tr('days', 'ڕۆژ')}
                </strong>
              </div>

              <div className="advisor-fact">
                <span>
                  {tr('Last 30 days', '٣٠ ڕۆژی ڕابردوو')}
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
                  {tr('active days', 'ڕۆژی چالاک')}
                </strong>
              </div>

              <div className="advisor-fact">
                <span>
                  {tr('Consistency', 'بەردەوامی')}
                </span>
                <strong>
                  {
                    tr(
                      context.consistency.trend,
                      context.consistency.trend === 'improving'
                        ? 'باشتر دەبێت'
                        : context.consistency.trend === 'declining'
                          ? 'خراپتر دەبێت'
                          : 'جێگیرە',
                    )
                  }
                </strong>
              </div>

              <div className="advisor-fact">
                <span>
                  {tr('Active goals', 'ئامانجە چالاکەکان')}
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
                  {tr('Best window', 'باشترین کات')}
                </span>
                <strong>
                  {context.bestStudyTime ??
                    tr('Still learning', 'هێشتا فێردەبێت')}
                </strong>
              </div>
            </div>

            <p className="advisor-v5-privacy">
              {tr('Raw session notes are not sent. The advisor receives summarized study facts and recent session metrics only, and only when you press Ask FOCUS.', 'تێبینی خامی سێشنەکان نانێردرێن. ڕاوێژکارەکە تەنها پوختەی زانیارییەکانی خوێندن و پێوانەکانی سێشنە نوێیەکان وەردەگرێت، تەنها کاتێک کرتە لە FOCUS بکەیت.')}
            </p>
          </div>
        </details>
      </div>
    </PageContainer>
  )
}
