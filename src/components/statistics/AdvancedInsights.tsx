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
import { useI18n } from '../../useI18n'
import { localizeUiText } from '../../utils/localizeUiText'

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
  const { language, tr } = useI18n()
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
            {tr('Advanced analytics', 'شیکردنەوەی پێشکەوتوو')}
          </div>

          <h2>
            {
              localizeUiText(language, analytics.headline)
            }
          </h2>

          <p>
            {tr('Last 30 days for quality signals · last 7 days for momentum.', '٣٠ ڕۆژی ڕابردوو بۆ نیشانەکانی کوالێتی · ٧ ڕۆژی ڕابردوو بۆ هێزی بەردەوامی.')}
          </p>
        </div>

        <div className="quality-orb">
          <span>
            {tr('Focus quality', 'کوالێتی سەرنج')}
          </span>
          <strong>
            {
              analytics.qualityScore
            }
          </strong>
          <small>
            {
              localizeUiText(language, analytics.qualityLabel)
            }
          </small>
        </div>
      </div>

      <div className="analytics-v3-grid">
        <article className="analytics-v3-card">
          <div>
            <Activity size={16} />
            {tr('Momentum', 'هێزی بەردەوامی')}
          </div>
          <strong>
            {signedPercent(
              analytics.momentumPercent,
            )}
          </strong>
          <span>
            {analytics.current7Minutes}m{' '}
            {tr('this 7d vs', 'ئەم ٧ ڕۆژە بەراورد بە')}{' '}
            {analytics.previous7Minutes}m
          </span>
        </article>

        <article className="analytics-v3-card">
          <div>
            <CalendarCheck2
              size={16}
            />
            {tr('Active days', 'ڕۆژە چالاکەکان')}
          </div>
          <strong>
            {
              analytics.current7ActiveDays
            }
            /7
          </strong>
          <span>
            {tr('Previous 7d', '٧ ڕۆژی پێشوو')}: {' '}
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
            {tr('Completion', 'تەواوکردن')}
          </div>
          <strong>
            {
              analytics.completionRate
            }
            %
          </strong>
          <span>
            {tr('Completed vs ended sessions', 'سێشنە تەواوکراوەکان بەراورد بە سێشنە کۆتاییهێنراوەکان')}
          </span>
        </article>

        <article className="analytics-v3-card">
          <div>
            <Zap size={16} />
            {tr('Interruptions', 'وەستاندنەکان')}
          </div>
          <strong>
            {
              analytics.averageInterruptions
            }
          </strong>
          <span>
            {tr('Average per completed session', 'ناوەند بۆ هەر سێشنێکی تەواوکراو')}
          </span>
        </article>

        <article className="analytics-v3-card">
          <div>
            <Layers3 size={16} />
            {tr('Deep work', 'کاری قووڵ')}
          </div>
          <strong>
            {
              analytics.deepWorkRatio
            }
            %
          </strong>
          <span>
            {tr('Time inside 45m+ sessions', 'کات لە سێشنە ٤٥ خولەک و زیاترەکاندا')}
          </span>
        </article>

        <article className="analytics-v3-card">
          <div>
            <BrainCircuit
              size={16}
            />
            {tr('Checklist', 'لیستی هەنگاوەکان')}
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
              ? tr('Use session checklists to unlock', 'لیستی هەنگاوەکانی سێشن بەکاربهێنە بۆ کردنەوەی ئەم داتا')
              : tr('Average task completion', 'ناوەندی تەواوکردنی ئەرکەکان')}
          </span>
        </article>
      </div>

      <div className="analytics-v3-footer">
        <div>
          <span>
            {tr('Strongest weekday', 'بەهێزترین ڕۆژی هەفتە')}
          </span>
          <strong>
            {analytics.strongestWeekday
              ? localizeUiText(language, analytics.strongestWeekday)
              : tr('Still learning', 'هێشتا فێردەبێت')}
          </strong>
        </div>

        <div>
          <span>
            {tr('Focus on that day', 'سەرنج لەو ڕۆژەدا')}
          </span>
          <strong>
            {
              analytics.strongestWeekdayMinutes
            }
            m
          </strong>
        </div>

        <p>
          {tr('Quality index blends completion, interruptions, deep-work share and checklist follow-through. It is a behavioral signal, not a grade.', 'پێوەری کوالێتی تەواوکردن، وەستاندن، بەشی کاری قووڵ و جێبەجێکردنی لیستی هەنگاوەکان تێکەڵ دەکات. ئەمە نیشانەی هەڵسوکەوتە، نە نمرە.')}
        </p>
      </div>
    </section>
  )
}
