import {
  ArrowRight,
  BrainCircuit,
} from 'lucide-react'
import type {
  Subject,
  StudySession,
} from '../../types'
import {
  getFocusPulse,
} from '../../utils/focusPulse'
import { useI18n } from '../../useI18n'
import { localizeUiText } from '../../utils/localizeUiText'

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

export default function FocusPulse({
  sessions,
  subjects,
  dailyGoal,
  weeklyGoal,
  onStart,
}: FocusPulseProps) {
  const { language, tr } = useI18n()
  const pulse = getFocusPulse(
    sessions,
    subjects,
    dailyGoal,
    weeklyGoal,
  )

  return (
    <section className="focus-pulse focus-pulse-v4 glass-panel">
      <div className="focus-pulse-main">
        <div className="focus-pulse-kicker">
          <BrainCircuit size={16} />
          {tr(
            'Next move',
            'هەنگاوی داهاتوو',
          )}
        </div>

        <h2 className="focus-pulse-headline">
          {localizeUiText(
            language,
            pulse.headline,
          )}
        </h2>

        <p className="focus-pulse-summary">
          {localizeUiText(
            language,
            pulse.summary,
          )}
        </p>

        <button
          type="button"
          className="focus-pulse-action"
          onClick={() =>
            onStart(
              pulse.action.subjectId,
              pulse.action.minutes,
            )
          }
        >
          {localizeUiText(
            language,
            pulse.action.label,
          )}
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="focus-pulse-side">
        <div className="focus-pulse-meter">
          <div className="focus-pulse-meter-row">
            <span>
              {tr(
                'Today',
                'ئەمڕۆ',
              )}
            </span>
            <strong>
              {pulse.todayMinutes}/
              {pulse.dailyGoal}
              {language === 'ku'
                ? ' خولەک'
                : 'm'}
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

        <div className="focus-pulse-meter focus-pulse-week">
          <div className="focus-pulse-meter-row">
            <span>
              {tr(
                'This week',
                'ئەم هەفتەیە',
              )}
            </span>
            <strong>
              {pulse.weeklyMinutes}/
              {pulse.weeklyGoal}
              {language === 'ku'
                ? ' خولەک'
                : 'm'}
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
      </div>
    </section>
  )
}
