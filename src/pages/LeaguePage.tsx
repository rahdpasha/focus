import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Crown,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'
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

function defaultProfile(
  displayName?: string,
): LeagueProfile {
  const name =
    displayName?.trim() || 'Focused learner'

  return {
    publicName: name,
    optIn: false,
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'UTC',
    avatarSeed: name,
  }
}

export default function LeaguePage({
  userId,
  displayName,
}: LeaguePageProps) {
  const [period, setPeriod] =
    useState<LeaguePeriod>('week')
  const [profile, setProfile] =
    useState<LeagueProfile>(
      () => defaultProfile(displayName),
    )
  const [entries, setEntries] =
    useState<LeagueEntry[]>([])
  const [
    lastWeekChampion,
    setLastWeekChampion,
  ] = useState<LeagueEntry | null>(null)
  const [
    lastMonthChampion,
    setLastMonthChampion,
  ] = useState<LeagueEntry | null>(null)
  const [loading, setLoading] =
    useState(() => Boolean(userId))
  const [saving, setSaving] =
    useState(false)
  const [message, setMessage] =
    useState('')

  const loadStandings = useCallback(
    async (nextPeriod: LeaguePeriod) => {
      const [
        current,
        lastWeek,
        lastMonth,
      ] = await Promise.all([
        getLeaderboard(nextPeriod),
        getLeaderboard(
          'week',
          previousWeekDate(),
        ),
        getLeaderboard(
          'month',
          previousMonthDate(),
        ),
      ])

      setEntries(current)
      setLastWeekChampion(
        lastWeek[0] ?? null,
      )
      setLastMonthChampion(
        lastMonth[0] ?? null,
      )
    },
    [],
  )

  useEffect(() => {
    if (!userId) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        let loadedProfile =
          await loadLeagueProfile(
            userId,
            displayName,
          )

        if (cancelled) return

        const browserTimezone =
          Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone ||
          'UTC'

        if (
          loadedProfile.timezone !==
          browserTimezone
        ) {
          loadedProfile = {
            ...loadedProfile,
            timezone:
              browserTimezone,
          }

          await saveLeagueProfile(
            userId,
            loadedProfile,
          )
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
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    displayName,
    loadStandings,
    period,
    userId,
  ])

  const currentUser = useMemo(
    () =>
      entries.find(
        (entry) =>
          entry.isCurrentUser,
      ) ?? null,
    [entries],
  )

  const nextRank = useMemo(() => {
    if (
      !currentUser ||
      currentUser.rank <= 1
    ) {
      return null
    }

    const target =
      entries.find(
        (entry) =>
          entry.rank ===
          currentUser.rank - 1,
      )

    if (!target) {
      return null
    }

    return {
      target,
      pointsNeeded:
        Math.max(
          3,
          target.points -
            currentUser.points +
            3,
        ),
    }
  }, [currentUser, entries])

  const switchPeriod = async (
    nextPeriod: LeaguePeriod,
  ) => {
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
      await saveLeagueProfile(
        userId,
        profile,
      )

      if (profile.optIn) {
        await refreshLeagueHistory(90)
      }

      await loadStandings(period)

      setMessage(
        profile.optIn
          ? 'You are in the League. Points come only from real completed study sessions.'
          : 'League participation is off. Your private study data stays private.',
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
          description="Weekly and monthly consistency competition."
        />
        <div
          className="glass-panel"
          style={{ padding: '24px' }}
        >
          Sign in with cloud sync enabled
          to use the League.
        </div>
      </PageContainer>
    )
  }

  const podium = entries.slice(0, 3)

  return (
    <PageContainer>
      <PageHeader
        title="FOCUS League"
        description="Consistency wins. Study at least 60 focused minutes in a day to earn 3 points."
      />

      <div className="league-layout">
        <div
          style={{
            display: 'grid',
            gap: '16px',
          }}
        >
          <div
            className="glass-panel"
            style={{ padding: '22px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                gap: '16px',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  flex: '1 1 320px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '8px',
                    fontSize: '12px',
                    color:
                      'var(--primary-glow)',
                    fontWeight: 700,
                    letterSpacing:
                      '0.08em',
                    textTransform:
                      'uppercase',
                  }}
                >
                  <Sparkles
                    size={16}
                  />
                  Season score
                </div>

                <div
                  style={{
                    marginTop: '7px',
                    color:
                      'var(--text-secondary)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                  }}
                >
                  Every successful study
                  day is worth exactly 3
                  points. Weekly standings
                  reset every Monday and
                  monthly standings reset
                  on the first day, while
                  previous winners remain
                  available.
                </div>
              </div>

              <div className="league-period-switch">
                {(
                  [
                    'week',
                    'month',
                  ] as LeaguePeriod[]
                ).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      void switchPeriod(
                        item,
                      )
                    }
                    style={{
                      padding:
                        '9px 14px',
                      borderRadius:
                        '9px',
                      background:
                        period === item
                          ? 'var(--primary-soft)'
                          : 'transparent',
                      color:
                        period === item
                          ? 'var(--primary-glow)'
                          : 'var(--text-muted)',
                      cursor:
                        'pointer',
                      textTransform:
                        'capitalize',
                      fontWeight: 700,
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {podium.length > 0 && (
            <div className="league-podium">
              {podium.map(
                (entry, index) => (
                  <div
                    key={
                      entry.publicName +
                      '-' +
                      entry.rank
                    }
                    className="glass-panel"
                    style={{
                      padding:
                        '20px',
                      textAlign:
                        'center',
                      transform:
                        index === 0
                          ? 'translateY(-4px)'
                          : undefined,
                    }}
                  >
                    <Crown
                      size={
                        index === 0
                          ? 26
                          : 20
                      }
                      style={{
                        marginBottom:
                          '10px',
                        color:
                          index === 0
                            ? 'var(--energy-glow)'
                            : 'var(--text-muted)',
                      }}
                    />

                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius:
                          '14px',
                        display:
                          'grid',
                        placeItems:
                          'center',
                        margin:
                          '0 auto 10px',
                        background:
                          'var(--primary-soft)',
                        color:
                          'var(--primary-glow)',
                        fontWeight: 800,
                      }}
                    >
                      {entry.publicName
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>

                    <div
                      style={{
                        color:
                          'var(--text-primary)',
                        fontWeight: 700,
                        fontSize:
                          '14px',
                      }}
                    >
                      {
                        entry.publicName
                      }
                    </div>

                    <div
                      className="mono"
                      style={{
                        marginTop:
                          '6px',
                        color:
                          'var(--primary-glow)',
                        fontSize:
                          '17px',
                      }}
                    >
                      {entry.points} pts
                    </div>

                    <div
                      style={{
                        marginTop:
                          '4px',
                        color:
                          'var(--text-muted)',
                        fontSize:
                          '10px',
                      }}
                    >
                      {
                        entry.completedDays
                      }{' '}
                      winning days
                    </div>
                  </div>
                ),
              )}
            </div>
          )}

          <div
            className="glass-panel"
            style={{ padding: '20px' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom:
                  '14px',
                color:
                  'var(--text-primary)',
                fontWeight: 700,
              }}
            >
              <Trophy size={18} />
              {period === 'week'
                ? 'Weekly'
                : 'Monthly'}{' '}
              standings
            </div>

            {loading ? (
              <div
                style={{
                  color:
                    'var(--text-muted)',
                  padding:
                    '18px 0',
                }}
              >
                Updating
                standings...
              </div>
            ) : entries.length === 0 ? (
              <div
                style={{
                  color:
                    'var(--text-muted)',
                  padding:
                    '18px 0',
                }}
              >
                No public competitors
                yet. The first
                consistent learner can
                take the top spot.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: '8px',
                }}
              >
                {entries.map(
                  (entry) => (
                    <div
                      key={
                        entry.publicName +
                        '-' +
                        entry.rank
                      }
                      style={{
                        display:
                          'grid',
                        gridTemplateColumns:
                          '48px minmax(0, 1fr) auto',
                        alignItems:
                          'center',
                        gap: '10px',
                        padding:
                          '12px',
                        borderRadius:
                          '12px',
                        border:
                          entry.isCurrentUser
                            ? '1px solid var(--primary-border)'
                            : '1px solid var(--void-border)',
                        background:
                          entry.isCurrentUser
                            ? 'var(--primary-soft)'
                            : 'var(--void-surface-hover)',
                      }}
                    >
                      <div
                        className="mono"
                        style={{
                          color:
                            entry.rank <=
                            3
                              ? 'var(--energy-glow)'
                              : 'var(--text-muted)',
                          fontWeight:
                            700,
                        }}
                      >
                        #{entry.rank}
                      </div>

                      <div>
                        <div
                          style={{
                            color:
                              'var(--text-primary)',
                            fontWeight:
                              650,
                            fontSize:
                              '13px',
                          }}
                        >
                          {
                            entry.publicName
                          }
                          {entry.isCurrentUser
                            ? ' · You'
                            : ''}
                        </div>

                        <div
                          style={{
                            marginTop:
                              '3px',
                            color:
                              'var(--text-muted)',
                            fontSize:
                              '10px',
                          }}
                        >
                          {
                            entry.completedDays
                          }{' '}
                          successful
                          days
                        </div>
                      </div>

                      <div
                        className="mono"
                        style={{
                          color:
                            'var(--primary-glow)',
                          fontWeight:
                            700,
                        }}
                      >
                        {entry.points}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: '16px',
          }}
        >
          <div
            className="glass-panel"
            style={{ padding: '20px' }}
          >
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems:
                  'center',
                marginBottom:
                  '16px',
                fontWeight: 700,
              }}
            >
              <ShieldCheck
                size={18}
              />
              Your public League
              profile
            </div>

            <label
              style={{
                display: 'grid',
                gap: '7px',
                color:
                  'var(--text-secondary)',
                fontSize: '12px',
              }}
            >
              Public name
              <input
                value={
                  profile.publicName
                }
                maxLength={40}
                onChange={(
                  event,
                ) =>
                  setProfile(
                    (current) => ({
                      ...current,
                      publicName:
                        event.target
                          .value,
                    }),
                  )
                }
                style={{
                  padding:
                    '10px 12px',
                }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                gap: '10px',
                alignItems:
                  'flex-start',
                marginTop:
                  '16px',
                color:
                  'var(--text-secondary)',
                fontSize: '12px',
                lineHeight: 1.5,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={
                  profile.optIn
                }
                onChange={(
                  event,
                ) =>
                  setProfile(
                    (current) => ({
                      ...current,
                      optIn:
                        event.target
                          .checked,
                    }),
                  )
                }
              />

              <span>
                Join public
                standings. Only your
                public name, score and
                successful-day count
                are shown. Your email,
                subjects, session
                notes and study
                history stay private.
              </span>
            </label>

            <button
              type="button"
              className="cyber-btn"
              disabled={saving}
              onClick={() =>
                void saveProfile()
              }
              style={{
                marginTop: '16px',
              }}
            >
              {saving
                ? 'SAVING...'
                : 'SAVE LEAGUE SETTINGS'}
            </button>

            {currentUser && (
              <div className="league-user-progress">
                <div>
                  <span>Current rank</span>
                  <strong>
                    #{currentUser.rank}
                  </strong>
                </div>

                <div>
                  <span>Score</span>
                  <strong>
                    {currentUser.points} pts
                  </strong>
                </div>

                <div>
                  <span>Next step</span>
                  <strong>
                    {nextRank
                      ? `${nextRank.pointsNeeded} pts to pass #${nextRank.target.rank}`
                      : 'You are at the top'}
                  </strong>
                </div>
              </div>
            )}
          </div>

          <div
            className="glass-panel"
            style={{ padding: '20px' }}
          >
            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '10px',
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.08em',
                marginBottom:
                  '12px',
              }}
            >
              Previous champions
            </div>

            <div
              style={{
                display: 'grid',
                gap: '10px',
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      'var(--text-secondary)',
                    fontSize:
                      '11px',
                  }}
                >
                  Last week
                </div>

                <div
                  style={{
                    color:
                      'var(--text-primary)',
                    marginTop:
                      '4px',
                    fontWeight:
                      700,
                  }}
                >
                  {lastWeekChampion
                    ?.publicName ??
                    'No winner yet'}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color:
                      'var(--text-secondary)',
                    fontSize:
                      '11px',
                  }}
                >
                  Last month
                </div>

                <div
                  style={{
                    color:
                      'var(--text-primary)',
                    marginTop:
                      '4px',
                    fontWeight:
                      700,
                  }}
                >
                  {lastMonthChampion
                    ?.publicName ??
                    'No winner yet'}
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div
              className="glass-panel"
              style={{
                padding: '16px',
                color:
                  'var(--text-secondary)',
                fontSize: '12px',
                lineHeight: 1.5,
              }}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
