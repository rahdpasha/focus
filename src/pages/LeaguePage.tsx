import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Clock,
  Crown,
  Flame,
  Lock,
  Medal,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'
import { supabase } from '../api/supabaseClient'
import {
  getLeaderboard,
  loadLeagueProfile,
  refreshLeagueHistory,
  saveLeagueProfile,
  type LeagueEntry,
  type LeaguePeriod,
  type LeagueProfile,
} from '../league/leagueStore'

interface LeaguePageProps {
  userId: string | null
  displayName?: string
}

function previousWeekDate(): Date {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  return date
}

function previousMonthDate(): Date {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() - 1)
  return date
}

function formatFocusedTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m'
  if (totalSeconds < 60) return '<1m'

  const minutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) return `${minutes}m`
  if (remainingMinutes === 0) return `${hours}h`

  return `${hours}h ${remainingMinutes}m`
}

function championLabel(entries: LeagueEntry[]): string | null {
  const winners = entries.filter(
    (entry) => entry.rank === 1 && entry.points > 0,
  )

  if (winners.length === 0) return null
  if (winners.length === 1) return winners[0].publicName

  return `${winners[0].publicName} + ${winners.length - 1} tied`
}

function defaultProfile(displayName?: string): LeagueProfile {
  const name = displayName?.trim() || 'Focused learner'

  return {
    publicName: name,
    optIn: false,
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    avatarSeed: name,
  }
}

export default function LeaguePage({
  userId,
  displayName,
}: LeaguePageProps) {
  const [period, setPeriod] = useState<LeaguePeriod>('week')
  const [profile, setProfile] = useState<LeagueProfile>(
    () => defaultProfile(displayName),
  )
  const [entries, setEntries] = useState<LeagueEntry[]>([])
  const [lastWeekChampion, setLastWeekChampion] =
    useState<string | null>(null)
  const [lastMonthChampion, setLastMonthChampion] =
    useState<string | null>(null)
  const [loading, setLoading] = useState(() => Boolean(userId))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadStandings = useCallback(
    async (nextPeriod: LeaguePeriod) => {
      const [current, lastWeek, lastMonth] = await Promise.all([
        getLeaderboard(nextPeriod),
        getLeaderboard('week', previousWeekDate()),
        getLeaderboard('month', previousMonthDate()),
      ])

      setEntries(current)
      setLastWeekChampion(championLabel(lastWeek))
      setLastMonthChampion(championLabel(lastMonth))
    },
    [],
  )

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    void (async () => {
      try {
        let loadedProfile = await loadLeagueProfile(
          userId,
          displayName,
        )

        if (cancelled) return

        const browserTimezone =
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          'UTC'

        if (loadedProfile.timezone !== browserTimezone) {
          loadedProfile = {
            ...loadedProfile,
            timezone: browserTimezone,
          }

          await saveLeagueProfile(userId, loadedProfile)
        }

        if (cancelled) return

        setProfile(loadedProfile)

        if (loadedProfile.optIn) {
          await refreshLeagueHistory(90)
        }

        if (cancelled) return
        await loadStandings(period)
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : 'League data could not be loaded.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [displayName, loadStandings, period, userId])

  const currentUser = useMemo(
    () => entries.find((entry) => entry.isCurrentUser) ?? null,
    [entries],
  )

  const nextRank = useMemo(() => {
    if (!currentUser || currentUser.rank <= 1) return null

    const target = entries.find(
      (entry) => entry.rank === currentUser.rank - 1,
    )

    if (!target) return null

    if (target.points === currentUser.points) {
      const secondsGap = Math.max(
        1,
        target.totalSeconds - currentUser.totalSeconds + 1,
      )

      return {
        target,
        label:
          secondsGap < 60
            ? `${secondsGap}s to pass #${target.rank}`
            : `${Math.ceil(secondsGap / 60)}m to pass #${target.rank}`,
      }
    }

    return {
      target,
      label: `${Math.max(
        1,
        target.points - currentUser.points,
      )} pts to reach #${target.rank}`,
    }
  }, [currentUser, entries])

  useEffect(() => {
    if (!supabase || !userId || !profile.optIn) return

    const channel = supabase
      .channel(`league-score-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_scores',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void loadStandings(period)
        },
      )
      .subscribe()

    return () => {
      void supabase?.removeChannel(channel)
    }
  }, [loadStandings, period, profile.optIn, userId])

  const switchPeriod = async (nextPeriod: LeaguePeriod) => {
    setPeriod(nextPeriod)
    setLoading(true)
    setMessage('')

    try {
      await loadStandings(nextPeriod)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Standings could not be loaded.',
      )
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!userId) return

    setSaving(true)
    setMessage('')

    try {
      await saveLeagueProfile(userId, profile)

      if (profile.optIn) {
        await refreshLeagueHistory(90)
      }

      await loadStandings(period)

      setMessage(
        profile.optIn
          ? 'League profile active. Your saved progress is live and completed timers update your score after cloud sync.'
          : 'You are hidden from public standings. Your score and League history stay saved for when you rejoin.',
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'League settings could not be saved.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (!userId) {
    return (
      <PageContainer>
        <PageHeader
          title="FOCUS League"
          description="Turn focused time into visible progress."
        />
        <div className="glass-panel league-v4-signed-out">
          <Trophy size={24} />
          <div>
            <strong>Enter the League</strong>
            <span>
              Sign in with cloud sync enabled to compete in weekly and
              monthly standings.
            </span>
          </div>
        </div>
      </PageContainer>
    )
  }

  const podium = [0, 1, 2].map((index) => ({
    place: index + 1,
    entry: entries[index] ?? null,
  }))

  const rankText = currentUser
    ? `#${currentUser.rank}`
    : profile.optIn
      ? '—'
      : 'OFF'

  const scoreText = currentUser
    ? `${currentUser.points} pts`
    : '0 pts'

  const totalTimeText = currentUser
    ? formatFocusedTime(currentUser.totalSeconds)
    : '0m'

  const scoredDaysText = currentUser
    ? String(currentUser.scoredDays)
    : '0'

  return (
    <PageContainer>
      <PageHeader
        title="FOCUS League"
        description="A competitive layer for consistency. Build points, climb the board, and protect your momentum."
      />

      <section className="league-v4-hero">
        <div className="league-v4-orbit league-v4-orbit-a" />
        <div className="league-v4-orbit league-v4-orbit-b" />

        <div className="league-v4-hero-copy">
          <div className="league-v4-kicker">
            <Sparkles size={15} />
            LIVE SEASON
            <span>{period.toUpperCase()}</span>
          </div>

          <h2>
            Earn your place.
            <br />
            <span>Then defend it.</span>
          </h2>

          <p>
            Your League score rewards showing up and going deeper.
            Every completed focus session moves your public standing.
          </p>

          <div className="league-v4-rule-row">
            <div className="league-v4-rule neutral">
              <span className="league-v4-rule-points">0</span>
              <div>
                <strong>NO STUDY</strong>
                <small>day closes at 0 seconds</small>
              </div>
            </div>

            <div className="league-v4-rule active">
              <span className="league-v4-rule-points">1</span>
              <div>
                <strong>SHOW UP</strong>
                <small>1 second → 90 minutes</small>
              </div>
            </div>

            <div className="league-v4-rule elite">
              <span className="league-v4-rule-points">3</span>
              <div>
                <strong>DEEP DAY</strong>
                <small>more than 90 minutes</small>
              </div>
            </div>
          </div>
        </div>

        <div className="league-v4-rank-core">
          <div className="league-v4-rank-glow" />
          <div className="league-v4-rank-ring">
            <span>YOUR RANK</span>
            <strong>{rankText}</strong>
            <small>{scoreText}</small>
          </div>

          <div className="league-v4-rank-target">
            <Target size={15} />
            <span>
              {currentUser?.rank === 1
                ? 'Hold the lead'
                : nextRank?.label ?? 'Join to enter the race'}
            </span>
          </div>
        </div>
      </section>

      <div className="league-v4-period-bar">
        <div>
          <span>STANDINGS WINDOW</span>
          <strong>
            {period === 'week' ? 'This week' : 'This month'}
          </strong>
        </div>

        <div className="league-v4-period-switch">
          {(['week', 'month'] as LeaguePeriod[]).map((item) => (
            <button
              key={item}
              type="button"
              className={period === item ? 'active' : ''}
              onClick={() => void switchPeriod(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className="league-v4-podium-shell">
        <div className="league-v4-section-head">
          <div>
            <span>ELITE BOARD</span>
            <h3>Top three</h3>
          </div>

          <div className="league-v4-live">
            <i />
            Live ranking
          </div>
        </div>

        <div className="league-v4-podium">
          {podium.map(({ entry, place }) => (
            <article
              key={
                entry
                  ? `${entry.publicName}-${entry.rank}`
                  : `open-${place}`
              }
              className={`league-v4-podium-card place-${place} ${
                entry?.isCurrentUser ? 'is-you' : ''
              }`}
            >
              <div className="league-v4-podium-top">
                <span>TOP {place}</span>
                {place === 1 ? (
                  <Crown size={22} />
                ) : (
                  <Medal size={20} />
                )}
              </div>

              <div className="league-v4-avatar">
                {entry
                  ? entry.publicName.slice(0, 1).toUpperCase()
                  : place}
              </div>

              <div className="league-v4-podium-name">
                <strong>
                  {entry ? entry.publicName : 'Open position'}
                </strong>
                {entry?.isCurrentUser && <span>YOU</span>}
              </div>

              <div className="league-v4-podium-score">
                {entry?.points ?? 0}
                <small>PTS</small>
              </div>

              <div className="league-v4-podium-meta">
                <span>
                  <Flame size={13} />
                  {entry?.scoredDays ?? 0} scored days
                </span>
                <span>
                  <Clock size={13} />
                  {entry
                    ? formatFocusedTime(entry.totalSeconds)
                    : '0m'}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="league-v4-grid">
        <section className="league-v4-board">
          <div className="league-v4-section-head">
            <div>
              <span>GLOBAL LADDER</span>
              <h3>
                {period === 'week' ? 'Weekly' : 'Monthly'} standings
              </h3>
            </div>
            <Trophy size={20} />
          </div>

          {loading ? (
            <div className="league-v4-empty">Updating standings…</div>
          ) : entries.length === 0 ? (
            <div className="league-v4-empty">
              No public competitors yet. The first learner can claim
              the board.
            </div>
          ) : (
            <div className="league-v4-rows">
              {entries.map((entry) => (
                <div
                  key={`${entry.publicName}-${entry.rank}`}
                  className={`league-v4-row ${
                    entry.isCurrentUser ? 'is-you' : ''
                  }`}
                >
                  <div className="league-v4-row-rank">
                    #{entry.rank}
                  </div>

                  <div className="league-v4-row-avatar">
                    {entry.publicName.slice(0, 1).toUpperCase()}
                  </div>

                  <div className="league-v4-row-person">
                    <strong>
                      {entry.publicName}
                      {entry.isCurrentUser ? ' · You' : ''}
                    </strong>
                    <span>
                      {entry.scoredDays} scored days ·{' '}
                      {formatFocusedTime(entry.totalSeconds)} focused
                    </span>
                  </div>

                  <div className="league-v4-row-points">
                    <strong>{entry.points}</strong>
                    <span>PTS</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="league-v4-side">
          <section className="league-v4-command">
            <div className="league-v4-command-head">
              <div>
                <span>YOUR COMMAND CENTER</span>
                <h3>{profile.publicName || 'Focused learner'}</h3>
              </div>
              <ShieldCheck size={21} />
            </div>

            <div className="league-v4-personal-stats">
              <div>
                <span>Rank</span>
                <strong>{rankText}</strong>
              </div>
              <div>
                <span>Score</span>
                <strong>{scoreText}</strong>
              </div>
              <div>
                <span>Focus</span>
                <strong>{totalTimeText}</strong>
              </div>
              <div>
                <span>Scored days</span>
                <strong>{scoredDaysText}</strong>
              </div>
            </div>

            <div className="league-v4-next-move">
              <div>
                <Zap size={16} />
                NEXT MOVE
              </div>
              <strong>
                {currentUser?.rank === 1
                  ? 'Protect #1. Another deep day keeps pressure on everyone below.'
                  : nextRank?.label ??
                    'Join public standings to start climbing.'}
              </strong>
            </div>

            <label className="league-v4-field">
              <span>Public name</span>
              <input
                value={profile.publicName}
                maxLength={40}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    publicName: event.target.value,
                  }))
                }
              />
            </label>

            <label className="league-v4-join">
              <input
                type="checkbox"
                checked={profile.optIn}
                onChange={(event) => {
                  const nextOptIn = event.target.checked

                  if (profile.optIn && !nextOptIn) {
                    const confirmed = window.confirm(
                      'Leave the League? You will be hidden from public standings, but your score and League progress will stay saved and return if you rejoin.',
                    )

                    if (!confirmed) return
                  }

                  setProfile((current) => ({
                    ...current,
                    optIn: nextOptIn,
                  }))
                }}
              />
              <span className="league-v4-join-control" />
              <span>
                <strong>
                  {profile.optIn ? 'Public standings ON' : 'Join League'}
                </strong>
                <small>
                  Leaving only hides your profile. Your League progress
                  stays saved.
                </small>
              </span>
            </label>

            <button
              type="button"
              className="cyber-btn league-v4-save"
              disabled={saving}
              onClick={() => void saveProfile()}
            >
              {saving ? 'SYNCING…' : 'SAVE LEAGUE SETTINGS'}
            </button>

            <div className="league-v4-privacy">
              <Lock size={14} />
              <span>
                Only your public name, score, scored-day count and
                aggregate focused time are visible. Email, subjects,
                notes and study history stay private.
              </span>
            </div>
          </section>

          <section className="league-v4-champions">
            <div className="league-v4-section-head compact">
              <div>
                <span>HALL OF FOCUS</span>
                <h3>Previous champions</h3>
              </div>
              <Crown size={18} />
            </div>

            <div className="league-v4-champion-grid">
              <div>
                <span>Last week</span>
                <strong>{lastWeekChampion ?? 'No winner yet'}</strong>
              </div>
              <div>
                <span>Last month</span>
                <strong>{lastMonthChampion ?? 'No winner yet'}</strong>
              </div>
            </div>
          </section>

          {message && (
            <div className="league-v4-message">{message}</div>
          )}
        </aside>
      </div>
    </PageContainer>
  )
}
