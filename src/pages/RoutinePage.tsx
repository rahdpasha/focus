import {
  Check,
  Circle,
  Flame,
  Play,
  Plus,
  RotateCw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import type {
  Subject,
  StudySession,
} from '../types'
import type {
  RoutineItem,
  RoutineSessionContext,
} from '../storage/types'
import {
  getRecentRoutineDates,
  getRecoverableRoutineOccurrences,
  getRotationItemForDate,
  getRoutineItemsForDate,
  getRoutineMinutesForDate,
  getRoutineStatus,
  getRoutineStreakStats,
  toRoutineDateKey,
} from '../utils/routine'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'
import { useI18n } from '../useI18n'

interface RoutinePageProps {
  subjects: Subject[]
  sessions: StudySession[]
  routineItems: RoutineItem[]
  onAddRoutineItem: (
    title: string,
    subjectId: string,
    targetMinutes: number,
    mode: RoutineItem['mode'],
    daysOfWeek?: number[],
    recoveryDays?: number,
  ) => void
  onUpdateRoutineItem: (
    id: string,
    patch: Partial<
      Omit<
        RoutineItem,
        'id' | 'createdAt'
      >
    >,
  ) => void
  onDeleteRoutineItem: (
    id: string,
  ) => void
  onStartSession: (
    subjectId?: string,
    minutes?: number,
    routineContext?: RoutineSessionContext,
  ) => void
}

function shortDay(
  date: Date,
  language: 'en' | 'ku',
) {
  return date.toLocaleDateString(
    language === 'ku'
      ? 'ku-IQ'
      : 'en-US',
    {
      weekday: 'short',
    },
  )
}

const WEEKDAYS = [
  { value: 0, label: 'S', labelKu: 'ی' },
  { value: 1, label: 'M', labelKu: 'د' },
  { value: 2, label: 'T', labelKu: 'س' },
  { value: 3, label: 'W', labelKu: 'چ' },
  { value: 4, label: 'T', labelKu: 'پ' },
  { value: 5, label: 'F', labelKu: 'ه' },
  { value: 6, label: 'S', labelKu: 'ش' },
]

function dayRuleLabel(
  days: number[],
  language: 'en' | 'ku',
): string {
  const normalized =
    Array.from(
      new Set(days),
    ).sort()

  if (normalized.length === 7) {
    return language === 'ku' ? 'هەموو ڕۆژێک' : 'Every day'
  }

  if (
    normalized.length === 5 &&
    [1, 2, 3, 4, 5].every(
      (day) => normalized.includes(day),
    )
  ) {
    return language === 'ku' ? 'ڕۆژانی هەفتە' : 'Weekdays'
  }

  if (
    normalized.length === 2 &&
    normalized.includes(0) &&
    normalized.includes(6)
  ) {
    return language === 'ku' ? 'کۆتایی هەفتە' : 'Weekends'
  }

  return normalized
    .map(
      (day) =>
        (
          language === 'ku'
            ? ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        )[day],
    )
    .join(', ')
}

export default function RoutinePage({
  subjects,
  sessions,
  routineItems,
  onAddRoutineItem,
  onUpdateRoutineItem,
  onDeleteRoutineItem,
  onStartSession,
}: RoutinePageProps) {
  const { t, tr, language } = useI18n()
  const [title, setTitle] =
    useState('')
  const [subjectId, setSubjectId] =
    useState(
      subjects[0]?.id ?? '',
    )
  const [
    targetMinutes,
    setTargetMinutes,
  ] = useState(25)
  const [mode, setMode] =
    useState<RoutineItem['mode']>(
      'fixed',
    )
  const [daysOfWeek, setDaysOfWeek] =
    useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [recoveryDays, setRecoveryDays] =
    useState(1)
  const [
    showRoutineAdvanced,
    setShowRoutineAdvanced,
  ] = useState(false)
  const [pendingDelete, setPendingDelete] =
    useState<string | null>(null)

  const [today, setToday] =
    useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(
      () => {
        setToday(new Date())
      },
      60_000,
    )

    return () =>
      window.clearInterval(timer)
  }, [])

  const selectedSubjectId =
    subjectId &&
    subjects.some(
      (subject) =>
        subject.id === subjectId,
    )
      ? subjectId
      : subjects[0]?.id ?? ''

  const recentDates = useMemo(
    () =>
      getRecentRoutineDates(
        7,
        today,
      ),
    [today],
  )

  const recoveryQueue =
    getRecoverableRoutineOccurrences(
      routineItems,
      sessions,
      today,
    )

  const streak =
    getRoutineStreakStats(
      routineItems,
      sessions,
      today,
    )

  const todaysItems =
    getRoutineItemsForDate(
      routineItems,
      today,
    )

  const rotationToday =
    getRotationItemForDate(
      routineItems,
      today,
    )

  const tomorrow =
    new Date(today)
  tomorrow.setDate(
    tomorrow.getDate() + 1,
  )

  const rotationTomorrow =
    getRotationItemForDate(
      routineItems,
      tomorrow,
    )

  const completedToday =
    todaysItems.filter(
      (item) => {
        const status =
          getRoutineStatus(
            item,
            routineItems,
            sessions,
            today,
          )

        return (
          status === 'done' ||
          status === 'recovered'
        )
      },
    ).length

  const addItem = () => {
    const subject =
      subjects.find(
        (item) =>
          item.id === selectedSubjectId,
      )

    if (!subject) return

    onAddRoutineItem(
      title.trim() ||
        subject.name,
      subject.id,
      targetMinutes,
      mode,
      daysOfWeek,
      recoveryDays,
    )

    setTitle('')
    setTargetMinutes(25)
  }

  const toggleBuilderDay = (
    day: number,
  ) => {
    setDaysOfWeek(
      (current) => {
        if (
          current.includes(day)
        ) {
          if (
            current.length === 1
          ) {
            return current
          }

          return current.filter(
            (value) =>
              value !== day,
          )
        }

        return [
          ...current,
          day,
        ].sort()
      },
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('routine')}
        description={t(
          'routinePageQuestion',
        )}
      />

      <div className="routine-v5">
        <section className="glass-panel routine-panel routine-summary">
          <div className="routine-summary-head">
            <div>
              <div className="eyebrow">{tr('Today', 'ئەمڕۆ')}</div>
              <h2>
                {completedToday}/{todaysItems.length} {tr('complete', 'تەواو')}
              </h2>
            </div>

            {rotationToday && (
              <div className="routine-rotation-note">
                <RotateCw size={14} />
                <span>
                  {tr('Rotation', 'گۆڕانکاری')}: <strong>{rotationToday.title}</strong>
                  {rotationTomorrow && (
                    <small> · {tr('Tomorrow', 'سبەی')}: {rotationTomorrow.title}</small>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="routine-summary-grid">
            <div className="routine-summary-stat">
              <span className="eyebrow routine-summary-label">
                <Flame size={13} />
                {tr('Current streak', 'زنجیرەی ئێستا')}
              </span>
              <strong className="mono">{language === 'ku'
                  ? `${streak.current} ڕۆژ`
                  : `${streak.current}d`}</strong>
            </div>

            <div className="routine-summary-stat">
              <span className="eyebrow">{tr('Best streak', 'باشترین زنجیرە')}</span>
              <strong className="mono">{language === 'ku'
                  ? `${streak.best} ڕۆژ`
                  : `${streak.best}d`}</strong>
            </div>

            <div className="routine-summary-stat">
              <span className="eyebrow">{tr('Today completed', 'تەواوکراوی ئەمڕۆ')}</span>
              <strong className="mono">
                {completedToday}/{todaysItems.length}
              </strong>
            </div>

            <div className="routine-summary-stat">
              <span className="eyebrow routine-summary-label">
                <ShieldCheck size={13} />
                {tr('Recovery', 'گەڕاندنەوە')}
              </span>
              <strong className="mono">{recoveryQueue.length} {tr('open', 'کراوە')}</strong>
              {streak.atRisk && (
                <small>{tr('Streak protected while recovery is open.', 'تا گەڕاندنەوە کراوە بێت، زنجیرەکەت پارێزراوە.')}</small>
              )}
            </div>
          </div>
        </section>

        <section className="routine-today-list">

          {todaysItems.length ===
          0 ? (
            <div className="glass-panel routine-panel routine-empty">
              {tr('Add fixed daily items or a rotation pool below.', 'لە خوارەوە کاری جێگیری ڕۆژانە یان کۆمەڵەی گۆڕاو زیاد بکە.')}
            </div>
          ) : (
            todaysItems.map(
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
                    today,
                  )
                const done =
                  minutes >=
                  item.targetMinutes

                return (
                  <article
                    key={item.id}
                    className="glass-panel routine-panel routine-item-card"
                  >
                    <div className="routine-item-head">
                      <div className="routine-item-identity">
                        <div
                          aria-label={done ? tr('Completed', 'تەواوکراو') : tr('Pending', 'چاوەڕوان')}
                          className={
                            done
                              ? 'routine-item-state complete'
                              : 'routine-item-state'
                          }
                        >
                          {done ? <Check size={18} /> : <Circle size={13} />}
                        </div>

                        <div>
                          <div className="routine-item-title">
                            {item.title}
                          </div>

                          <div className="routine-item-subtitle">
                            {subject?.name ?? tr('Subject removed', 'بابەت لابراوە')} ·{' '}
                            {item.mode === 'fixed' ? tr('Every day', 'هەموو ڕۆژێک') : tr('Rotation', 'گۆڕاو')}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="cyber-btn routine-primary-action"
                        disabled={
                          !subject
                        }
                        onClick={() =>
                          onStartSession(
                            item.subjectId,
                            Math.max(
                              1,
                              item.targetMinutes -
                                minutes,
                            ),
                            {
                              itemId:
                                item.id,
                              routineDate:
                                toRoutineDateKey(
                                  today,
                                ),
                            },
                          )
                        }
                      >
                        <Play
                          size={14}
                        />
                        {done
                          ? tr('Focus again', 'دووبارە سەرنج بدە')
                          : tr(`Start ${item.targetMinutes}m`, `دەست پێ بکە ${item.targetMinutes} خولەک`)}
                      </button>
                    </div>

                    <div>
                      <div className="routine-progress-meta">
                        <span>
                          {language === 'ku'
                            ? `${minutes} خولەک سەرنج`
                            : `${minutes}m focused`}
                        </span>
                        <span>
                          {
                            item.targetMinutes
                          }{language === 'ku'
                            ? ' خولەک '
                            : 'm '}
                          {tr('target', 'ئامانج')}
                        </span>
                      </div>

                      <div className="routine-progress-track">
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (minutes / item.targetMinutes) * 100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="routine-week-grid">
                      {recentDates.map(
                        (date) => {
                          const status =
                            getRoutineStatus(
                              item,
                              routineItems,
                              sessions,
                              date,
                              today,
                            )

                          return (
                            <div
                              key={date.toISOString()}
                              title={
                                 status === 'done'
                                   ? tr('Completed', 'تەواوکراو')
                                   : status === 'recovered'
                                     ? tr('Recovered', 'گەڕێندرایەوە')
                                     : status === 'recoverable'
                                       ? tr('Can recover', 'دەتوانرێت بگەڕێندرێتەوە')
                                       : status === 'missed'
                                         ? tr('Missed', 'لەدەستچوو')
                                         : status === 'pending'
                                           ? tr('Pending', 'چاوەڕوان')
                                           : tr('Off', 'ناچالاک')
                               }
                              className={`routine-day-status ${status}`}
                            >
                              <span>
                                {status === 'done' ? (
                                  <Check size={13} />
                                ) : status === 'recovered' ? (
                                  <RotateCw size={13} />
                                ) : status === 'recoverable' ? (
                                  <Circle size={12} />
                                ) : status === 'missed' ? (
                                  <X size={13} />
                                ) : status === 'pending' ? (
                                  <Circle size={8} />
                                ) : (
                                  '—'
                                )}
                              </span>
                              <small>{shortDay(date, language)}</small>
                            </div>
                          )
                        },
                      )}
                    </div>
                  </article>
                )
              },
            )
          )}
        </section>

        {recoveryQueue.length > 0 && (
          <section className="glass-panel routine-panel routine-recovery">
            <div className="eyebrow">
              {tr('Missed-day recovery', 'گەڕاندنەوەی ڕۆژی لەدەستچوو')}
            </div>
            <h2>{tr('Recover without mixing days', 'گەڕاندنەوە بەبێ تێکەڵکردنی ڕۆژەکان')}</h2>
            <p>
              {tr('Recovery focus is credited to the missed routine day, while today keeps its own progress.', 'سەرنجی گەڕاندنەوە بۆ ڕۆژی ڕوتینی لەدەستچوو تۆمار دەکرێت و پێشکەوتنی ئەمڕۆ جیا دەمێنێتەوە.')}
            </p>

            <div className="routine-recovery-list">
              {recoveryQueue.map(
                (entry) => (
                  <div
                    key={entry.item.id + entry.dateKey}
                    className="routine-recovery-card"
                  >
                    <div>
                      <strong>
                        {
                          entry.item
                            .title
                        }
                      </strong>
                      <div className="routine-recovery-meta">
                        {entry.date.toLocaleDateString(
                          language === 'ku'
                            ? 'ku-IQ'
                            : 'en-US',
                          {
                            weekday:
                              'short',
                            month:
                              'short',
                            day:
                              'numeric',
                          },
                        )}{' '}
                        · {
                          entry.remainingMinutes
                        }{language === 'ku'
                          ? ' خولەک '
                          : 'm '}
                        {tr('remaining', 'ماوە')}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="cyber-btn routine-primary-action"
                      onClick={() =>
                        onStartSession(
                          entry.item
                            .subjectId,
                          entry.remainingMinutes,
                          {
                            itemId:
                              entry.item
                                .id,
                            routineDate:
                              entry.dateKey,
                          },
                        )
                      }
                    >
                      {tr('Recover', 'گەڕاندنەوە')}
                    </button>
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        <section className="glass-panel routine-panel routine-builder">
          <div className="eyebrow">
            {tr('Build your routine', 'ڕوتینەکەت دروست بکە')}
          </div>
          <h2>{tr('Fixed + rotating study', 'خوێندنی جێگیر + گۆڕاو')}</h2>

          <div className="routine-builder-grid">
            <input
              value={title}
              maxLength={80}
              placeholder={tr('Name (optional)', 'ناو (ئارەزوومەندانە)')}
              onChange={(event) =>
                setTitle(
                  event.target
                    .value,
                )
              }
            />

            <select
              value={selectedSubjectId}
              onChange={(event) =>
                setSubjectId(
                  event.target
                    .value,
                )
              }
            >
              <option value="">
                {tr('Select subject', 'بابەت هەڵبژێرە')}
              </option>
              {subjects.map(
                (subject) => (
                  <option
                    key={
                      subject.id
                    }
                    value={
                      subject.id
                    }
                  >
                    {
                      subject.name
                    }
                  </option>
                ),
              )}
            </select>

            <input
              type="number"
              min={1}
              max={720}
              value={targetMinutes}
              onChange={(
                event,
              ) =>
                setTargetMinutes(
                  Number(
                    event.target
                      .value,
                  ),
                )
              }
              aria-label={tr('Routine target minutes', 'خولەکی ئامانجی ڕوتین')}
            />

            <button
              type="button"
              className="v4-advanced-toggle"
              aria-expanded={showRoutineAdvanced}
              onClick={() =>
                setShowRoutineAdvanced(
                  (value) => !value,
                )
              }
            >
              {showRoutineAdvanced
                ? tr('Hide advanced options', 'هەڵبژاردە پێشکەوتووەکان بشارەوە')
                : tr('Advanced options', 'هەڵبژاردە پێشکەوتووەکان')}
            </button>

            <button
              type="button"
              className="cyber-btn routine-primary-action"
              disabled={!selectedSubjectId}
              onClick={addItem}
            >
              <Plus size={15} />
              {tr('Add routine', 'زیادکردنی ڕوتین')}
            </button>
          </div>

          {showRoutineAdvanced && (
            <div className="v4-advanced-panel routine-advanced-panel">
              <div className="routine-advanced-selects">
                <label>
                  <span>{tr('Type', 'جۆر')}</span>
                  <select
                    value={mode}
                    onChange={(event) =>
                      setMode(
                        event.target
                          .value as RoutineItem['mode'],
                      )
                    }
                  >
                    <option value="fixed">
                      {tr('Fixed', 'جێگیر')}
                    </option>
                    <option value="rotation">
                      {tr('Rotation pool', 'کۆمەڵەی گۆڕاو')}
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    {tr('Recovery', 'گەڕاندنەوە')}
                  </span>
                  <select
                    value={recoveryDays}
                    onChange={(event) =>
                      setRecoveryDays(
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    aria-label={tr('Recovery window', 'ماوەی گەڕاندنەوە')}
                  >
                    <option value={0}>
                      {tr('No recovery', 'بێ گەڕاندنەوە')}
                    </option>
                    <option value={1}>
                      {tr('+1 day', '+١ ڕۆژ')}
                    </option>
                    <option value={2}>
                      {tr('+2 days', '+٢ ڕۆژ')}
                    </option>
                    <option value={3}>
                      {tr('+3 days', '+٣ ڕۆژ')}
                    </option>
                  </select>
                </label>
              </div>

              <div className="routine-builder-row">
                <span className="routine-builder-label">{tr('Schedule', 'خشتە')}</span>

                {[
                  {
                    label: tr('Every day', 'هەموو ڕۆژێک'),
                    days: [0, 1, 2, 3, 4, 5, 6],
                  },
                  {
                    label: tr('Weekdays', 'ڕۆژانی هەفتە'),
                    days: [1, 2, 3, 4, 5],
                  },
                  {
                    label: tr('Weekends', 'کۆتایی هەفتە'),
                    days: [0, 6],
                  },
                ].map((preset) => {
                  const active =
                    preset.days.length ===
                      daysOfWeek.length &&
                    preset.days.every((day) =>
                      daysOfWeek.includes(day),
                    )

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setDaysOfWeek(
                          preset.days,
                        )
                      }
                      className={
                        active
                          ? 'routine-schedule-preset active'
                          : 'routine-schedule-preset'
                      }
                    >
                      {preset.label}
                    </button>
                  )
                })}

                <span className="routine-builder-value">
                  {dayRuleLabel(daysOfWeek, language)}
                </span>
              </div>

              <div className="routine-builder-row compact">
                <span className="routine-builder-label">{tr('Days', 'ڕۆژەکان')}</span>

                {WEEKDAYS.map(
                  (day) => {
                    const active =
                      daysOfWeek.includes(
                        day.value,
                      )

                    return (
                      <button
                        key={day.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleBuilderDay(day.value)}
                        className={
                          active
                            ? 'routine-day-toggle builder-day active'
                            : 'routine-day-toggle builder-day'
                        }
                      >
                        {language === 'ku' ? day.labelKu : day.label}
                      </button>
                    )
                  },
                )}
              </div>
            </div>
          )}

          <div className="routine-config-list">
            {routineItems.map(
              (item) => {
                const subject =
                  subjects.find(
                    (candidate) =>
                      candidate.id ===
                      item.subjectId,
                  )

                return (
                  <div key={item.id} className="routine-config-card">
                    <div>
                      <div className="routine-config-title">
                        {item.title}
                      </div>
                      <div className="routine-config-meta">
                        {subject
                          ?.name ??
                          tr('Subject removed', 'بابەت لابراوە')}{' '}
                        · {
                          item.targetMinutes
                        }{language === 'ku'
                          ? ' خولەک'
                          : 'm'} · {
                          item.mode === 'fixed'
                            ? tr('Fixed', 'جێگیر')
                            : tr('Rotation', 'گۆڕاو')
                        } · {
                          dayRuleLabel(
                            item.daysOfWeek,
                            language,
                          )
                        } · {tr('recovery', 'گەڕاندنەوە')} {
                          language === 'ku'
                            ? `${item.recoveryDays} ڕۆژ`
                            : `${item.recoveryDays}d`
                        }
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateRoutineItem(item.id, {
                          enabled: !item.enabled,
                        })
                      }
                      aria-label={
                        item.enabled
                          ? tr('Disable routine item', 'ڕوتینەکە ناچالاک بکە')
                          : tr('Enable routine item', 'ڕوتینەکە چالاک بکە')
                      }
                      className={
                        item.enabled
                          ? 'routine-config-toggle active'
                          : 'routine-config-toggle'
                      }
                    >
                      {item.enabled ? (
                        <Check
                          size={15}
                        />
                      ) : (
                        <Circle
                          size={15}
                        />
                      )}
                      {item.enabled
                        ? tr('On', 'چالاک')
                        : tr('Off', 'ناچالاک')}
                    </button>

                    <button
                      type="button"
                      className={
                        pendingDelete === item.id
                          ? 'routine-config-delete confirm'
                          : 'routine-config-delete'
                      }
                      aria-label={
                        pendingDelete ===
                        item.id
                          ? tr('Confirm delete routine item', 'سڕینەوەی ڕوتین پشتڕاست بکەوە')
                          : tr('Delete routine item', 'ڕوتین بسڕەوە')
                      }
                      onClick={() => {
                        if (
                          pendingDelete ===
                          item.id
                        ) {
                          onDeleteRoutineItem(
                            item.id,
                          )
                          setPendingDelete(
                            null,
                          )
                          return
                        }

                        setPendingDelete(
                          item.id,
                        )
                      }}
                    >
                      {pendingDelete ===
                      item.id ? (
                        <X size={16} />
                      ) : (
                        <Trash2
                          size={16}
                        />
                      )}
                    </button>

                    <div className="routine-config-controls">
                      {WEEKDAYS.map(
                        (day) => {
                          const active =
                            item.daysOfWeek.includes(
                              day.value,
                            )

                          return (
                            <button
                              key={day.value}
                              type="button"
                              aria-pressed={
                                active
                              }
                              onClick={() => {
                                const next =
                                  active
                                    ? item.daysOfWeek.filter(
                                        (
                                          value,
                                        ) =>
                                          value !==
                                          day.value,
                                      )
                                    : [
                                        ...item.daysOfWeek,
                                        day.value,
                                      ].sort()

                                if (
                                  next.length ===
                                  0
                                ) {
                                  return
                                }

                                onUpdateRoutineItem(
                                  item.id,
                                  {
                                    daysOfWeek:
                                      next,
                                  },
                                )
                              }}
                              className={
                                active
                                  ? 'routine-day-toggle active'
                                  : 'routine-day-toggle'
                              }
                            >
                              {
                                day.label
                              }
                            </button>
                          )
                        },
                      )}

                      <select
                        aria-label={
                          tr('Recovery window for', 'ماوەی گەڕاندنەوە بۆ') +
                          ' ' + item.title
                        }
                        value={
                          item.recoveryDays
                        }
                        onChange={(
                          event,
                        ) =>
                          onUpdateRoutineItem(
                            item.id,
                            {
                              recoveryDays:
                                Number(
                                  event.target
                                    .value,
                                ),
                            },
                          )
                        }
                        className="routine-recovery-select"
                      >
                        <option value={0}>
                          {tr('No recovery', 'بێ گەڕاندنەوە')}
                        </option>
                        <option value={1}>
                          {tr('+1 day', '+١ ڕۆژ')}
                        </option>
                        <option value={2}>
                          {tr('+2 days', '+٢ ڕۆژ')}
                        </option>
                        <option value={3}>
                          {tr('+3 days', '+٣ ڕۆژ')}
                        </option>
                      </select>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
