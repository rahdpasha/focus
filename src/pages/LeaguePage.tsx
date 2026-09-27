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
import { useI18n } from '../useI18n'
import {
  getLeaderboard,
  getLeagueChampionHistory,
  getLeagueSeasonLeaderboard,
  loadLeagueProfile,
  refreshLeagueHistory,
  saveLeagueProfile,
  type LeagueChampionWeek,
  type LeagueEntry,
  type LeaguePeriod,
  type LeagueProfile,
} from '../league/leagueStore'

interface LeaguePageProps {
  userId: string | null
  displayName?: string
}

function previousWeekDate(weeksAgo = 1): Date {
  const date = new Date()
  date.setDate(date.getDate() - 7 * weeksAgo)
  return date
}

function previousMonthDate(): Date {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() - 1)
  return date
}

function currentSeasonLabel(
  language: 'en' | 'ku',
): string {
  const now = new Date()
  const quarter =
    Math.floor(now.getMonth() / 3)
  const start = new Date(
    now.getFullYear(),
    quarter * 3,
    1,
  )
  const end = new Date(
    now.getFullYear(),
    quarter * 3 + 3,
    0,
  )
  const locale =
    language === 'ku' ? 'ckb-IQ' : 'en-US'
  const startLabel = start.toLocaleDateString(
    locale,
    { month: 'short' },
  )
  const endLabel = end.toLocaleDateString(
    locale,
    { month: 'short', year: 'numeric' },
  )

  return `${startLabel} – ${endLabel}`
}

function formatChampionWeek(
  weekStart: string,
  language: 'en' | 'ku',
): string {
  const start = new Date(`${weekStart}T12:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  const locale =
    language === 'ku' ? 'ckb-IQ' : 'en-US'
  const startLabel = start.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })
  const endLabel = end.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })

  return `${startLabel} – ${endLabel}`
}

function formatFocusedTime(
  totalSeconds: number,
  language: 'en' | 'ku',
): string {
  const minuteUnit = language === 'ku' ? ' خولەک' : 'm'
  const hourUnit = language === 'ku' ? ' کاتژمێر' : 'h'

  if (totalSeconds <= 0) return `0${minuteUnit}`
  if (totalSeconds < 60) return `<1${minuteUnit}`

  const minutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) return `${minutes}${minuteUnit}`
  if (remainingMinutes === 0) return `${hours}${hourUnit}`

  return `${hours}${hourUnit} ${remainingMinutes}${minuteUnit}`
}

function championTier(
  count: number,
): 'rookie' | 'proven' | 'elite' | 'legend' {
  if (count >= 10) return 'legend'
  if (count >= 5) return 'elite'
  if (count >= 3) return 'proven'
  return 'rookie'
}

function nextChampionMilestone(
  count: number,
): number {
  if (count < 1) return 1
  if (count < 3) return 3
  if (count < 5) return 5
  if (count < 10) return 10
  return Math.ceil((count + 1) / 5) * 5
}

function championTierLabel(
  count: number,
  tr: (en: string, ku: string) => string,
): string {
  if (count >= 10) {
    return tr('Legendary Champion', 'پاڵەوانی ئەفسانەیی')
  }

  if (count >= 5) {
    return tr('Elite Champion', 'پاڵەوانی هەڵبژاردە')
  }

  if (count >= 3) {
    return tr('Proven Champion', 'پاڵەوانی سەلمێنراو')
  }

  return tr('League Champion', 'پاڵەوانی پێشبڕکێ')
}

function championKey(
  publicName: string,
  avatarSeed: string,
): string {
  const stableSeed = avatarSeed.trim()

  return stableSeed || publicName.trim()
}

function championEntries(
  entries: LeagueEntry[],
): LeagueEntry[] {
  return entries.filter(
    (entry) => entry.rank === 1 && entry.points > 0,
  )
}

function championLabel(
  entries: LeagueEntry[],
  language: 'en' | 'ku',
): string | null {
  const winners = championEntries(entries)

  if (winners.length === 0) return null
  if (winners.length === 1) return winners[0].publicName

  return language === 'ku'
    ? `${winners[0].publicName} + ${winners.length - 1} هاوپلە`
    : `${winners[0].publicName} + ${winners.length - 1} tied`
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
  const { language, tr } = useI18n()
  const [period, setPeriod] = useState<LeaguePeriod>('week')
  const [profile, setProfile] = useState<LeagueProfile>(
    () =>
      defaultProfile(
        displayName ||
          tr('Focused learner', 'خوێنەری سەرنجدار'),
      ),
  )
  const [entries, setEntries] = useState<LeagueEntry[]>([])
  const [seasonEntries, setSeasonEntries] =
    useState<LeagueEntry[]>([])
  const [championHistory, setChampionHistory] =
    useState<LeagueChampionWeek[]>([])
  const [lastWeekChampion, setLastWeekChampion] =
    useState<string | null>(null)
  const [lastWeekWinners, setLastWeekWinners] =
    useState<LeagueEntry[]>([])
  const [twoWeeksAgoWinners, setTwoWeeksAgoWinners] =
    useState<LeagueEntry[]>([])
  const [threeWeeksAgoWinners, setThreeWeeksAgoWinners] =
    useState<LeagueEntry[]>([])
  const [lastMonthChampion, setLastMonthChampion] =
    useState<string | null>(null)
  const [loading, setLoading] = useState(() => Boolean(userId))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadStandings = useCallback(
    async (nextPeriod: LeaguePeriod) => {
      const [
        current,
        lastWeek,
        twoWeeksAgo,
        threeWeeksAgo,
        lastMonth,
        championWeeks,
        seasonStandings,
      ] = await Promise.all([
        getLeaderboard(nextPeriod),
        getLeaderboard('week', previousWeekDate()),
        getLeaderboard('week', previousWeekDate(2)),
        getLeaderboard('week', previousWeekDate(3)),
        getLeaderboard('month', previousMonthDate()),
        getLeagueChampionHistory(),
        getLeagueSeasonLeaderboard(),
      ])

      setEntries(current)
      setSeasonEntries(seasonStandings)
      setChampionHistory(championWeeks)
      setLastWeekWinners(
        championEntries(lastWeek),
      )
      setTwoWeeksAgoWinners(
        championEntries(twoWeeksAgo),
      )
      setThreeWeeksAgoWinners(
        championEntries(threeWeeksAgo),
      )
      setLastWeekChampion(
        championLabel(
          lastWeek,
          language,
        ),
      )
      setLastMonthChampion(
        championLabel(
          lastMonth,
          language,
        ),
      )
    },
    [language],
  )

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    void (async () => {
      try {
        let loadedProfile = await loadLeagueProfile(
          userId,
          displayName ||
            tr('Focused learner', 'خوێنەری سەرنجدار'),
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
      } catch {
        if (!cancelled) {
          setMessage(
            tr(
              'League data could not be loaded.',
              'نەتوانرا داتای پێشبڕکێ بار بکرێت.',
            ),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [displayName, loadStandings, period, tr, userId])

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
            ? tr(
                `${secondsGap}s to pass #${target.rank}`,
                `${secondsGap} چرکە بۆ تێپەڕاندنی #${target.rank}`,
              )
            : tr(
                `${Math.ceil(secondsGap / 60)}m to pass #${target.rank}`,
                `${Math.ceil(secondsGap / 60)} خولەک بۆ تێپەڕاندنی #${target.rank}`,
              ),
      }
    }

    return {
      target,
      label: tr(
        `${Math.max(1, target.points - currentUser.points)} pts to reach #${target.rank}`,
        `${Math.max(1, target.points - currentUser.points)} خاڵ بۆ گەیشتن بە #${target.rank}`,
      ),
    }
  }, [currentUser, entries, tr])

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
          : tr('Standings could not be loaded.', 'نەتوانرا ڕیزبەندی بار بکرێت.'),
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
          ? tr('League profile active. Your saved progress is live and completed timers update your score after cloud sync.', 'پڕۆفایلی پێشبڕکێ چالاکە. پێشکەوتنی پاشەکەوتکراوت چالاکە و سێشنە تەواوکراوەکان دوای هاوکاتکردنی کڵاود خاڵەکەت نوێ دەکەنەوە.')
          : tr('You are hidden from public standings. Your score and League history stay saved for when you rejoin.', 'لە ڕیزبەندی گشتی شاراوەیت. خاڵ و مێژووی پێشبڕکێت پاشەکەوت دەمێنێتەوە تا دووبارە بەشدار بیت.'),
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : tr('League settings could not be saved.', 'نەتوانرا ڕێکخستنەکانی پێشبڕکێ پاشەکەوت بکرێن.'),
      )
    } finally {
      setSaving(false)
    }
  }

  if (!userId) {
    return (
      <PageContainer>
        <PageHeader
          title={tr('FOCUS League', 'پێشبڕکێی FOCUS')}
          description={tr('Turn focused time into visible progress.', 'کاتی سەرنج بگۆڕە بە پێشکەوتنێکی دیار.')}
        />
        <div className="glass-panel league-v4-signed-out">
          <Trophy size={24} />
          <div>
            <strong>{tr('Enter the League', 'بچۆ ناو پێشبڕکێ')}</strong>
            <span>
              {tr('Sign in with cloud sync enabled to compete in weekly and monthly standings.', 'بچۆ ژوورەوە و هاوکاتکردنی کڵاود چالاک بکە بۆ بەشداری لە ڕیزبەندی هەفتانە و مانگانە.')}
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

  const seasonCurrentUser =
    seasonEntries.find(
      (entry) => entry.isCurrentUser,
    ) ?? null

  const seasonLeader =
    seasonEntries[0] ?? null

  const seasonGap =
    seasonCurrentUser && seasonLeader
      ? Math.max(
          0,
          seasonLeader.points -
            seasonCurrentUser.points,
        )
      : null

  const rankText = currentUser
    ? `#${currentUser.rank}`
    : profile.optIn
      ? '—'
      : tr('Off', 'ناچالاک')

  const scoreText = currentUser
    ? tr(`${currentUser.points} pts`, `${currentUser.points} خاڵ`)
    : tr('0 pts', '٠ خاڵ')

  const totalTimeText = currentUser
    ? formatFocusedTime(currentUser.totalSeconds, language)
    : language === 'ku' ? '0 خولەک' : '0m'

  const scoredDaysText = currentUser
    ? String(currentUser.scoredDays)
    : '0'


  const championTitleCounts = (() => {
    const counts = new Map<string, number>()

    championHistory.forEach((winner) => {
      const key = championKey(
        winner.publicName,
        winner.avatarSeed,
      )
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })

    return counts
  })()

  const championCountFor = (
    entry: Pick<LeagueEntry, 'publicName' | 'avatarSeed'>,
  ) =>
    championTitleCounts.get(
      championKey(
        entry.publicName,
        entry.avatarSeed,
      ),
    ) ?? 0

  const titleLeaders = Array.from(
    championTitleCounts.entries(),
  )
    .map(([key, count]) => {
      const representative =
        championHistory.find(
          (winner) =>
            championKey(
              winner.publicName,
              winner.avatarSeed,
            ) === key,
        )

      return {
        key,
        publicName:
          representative?.publicName ?? key,
        avatarSeed:
          representative?.avatarSeed ?? key,
        count,
      }
    })
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count
      }

      return a.publicName.localeCompare(
        b.publicName,
      )
    })

  const championHallRows = titleLeaders
    .map((leader, index) => {
      const latestTitle =
        championHistory.find(
          (winner) =>
            championKey(
              winner.publicName,
              winner.avatarSeed,
            ) === leader.key,
        ) ?? null

      return {
        ...leader,
        rank: index + 1,
        latestTitle,
      }
    })
    .slice(0, 8)

  const recordTitleCount =
    titleLeaders[0]?.count ?? 0

  const currentUserChampionships =
    championHistory.filter(
      (winner) => winner.isCurrentUser,
    )

  const currentUserTitleCount =
    currentUserChampionships.length

  const currentUserLastTitle =
    currentUserChampionships[0] ?? null

  const currentUserNextMilestone =
    nextChampionMilestone(
      currentUserTitleCount,
    )

  const currentUserTitlesToMilestone =
    Math.max(
      0,
      currentUserNextMilestone -
        currentUserTitleCount,
    )

  const recordHolders = titleLeaders.filter(
    (entry) =>
      entry.count === recordTitleCount,
  )

  const lastWeekTitleCount =
    lastWeekWinners.length === 1
      ? championCountFor(lastWeekWinners[0])
      : 0

  const lastWeekWinnerNames =
    lastWeekWinners.length === 0
      ? null
      : lastWeekWinners.length === 1
        ? lastWeekWinners[0].publicName
        : language === 'ku'
          ? `${lastWeekWinners[0].publicName} + ${lastWeekWinners.length - 1} هاوپلە`
          : `${lastWeekWinners[0].publicName} + ${lastWeekWinners.length - 1} tied`

  const defendingChampionKeys = new Set(
    lastWeekWinners.map((entry) =>
      championKey(
        entry.publicName,
        entry.avatarSeed,
      ),
    ),
  )

  const isDefendingChampion = (
    entry: Pick<LeagueEntry, 'publicName' | 'avatarSeed'>,
  ) =>
    defendingChampionKeys.has(
      championKey(
        entry.publicName,
        entry.avatarSeed,
      ),
    )

  const currentUserWonLastWeek =
    lastWeekWinners.some(
      (entry) => entry.isCurrentUser,
    )

  const championStreak = (() => {
    if (lastWeekWinners.length === 0) return 0

    const priorTwoNames = new Set(
      twoWeeksAgoWinners.map(
        (entry) => entry.publicName,
      ),
    )
    const priorThreeNames = new Set(
      threeWeeksAgoWinners.map(
        (entry) => entry.publicName,
      ),
    )

    return lastWeekWinners.reduce(
      (best, winner) => {
        const wonTwoWeeksAgo =
          priorTwoNames.has(
            winner.publicName,
          )

        if (!wonTwoWeeksAgo) {
          return Math.max(best, 1)
        }

        const wonThreeWeeksAgo =
          priorThreeNames.has(
            winner.publicName,
          )

        return Math.max(
          best,
          wonThreeWeeksAgo ? 3 : 2,
        )
      },
      1,
    )
  })()

  const championTitle =
    championStreak >= 3
      ? tr(
          '3× League Champion',
          '٣ جار پاڵەوانی پێشبڕکێ',
        )
      : championStreak === 2
        ? tr(
            'Back-to-back Champion',
            'دوو هەفتە بەردەوام پاڵەوان',
          )
        : tr(
            'Weekly Champion',
            'پاڵەوانی هەفتە',
          )

  const championMotivation = (() => {
    const winnerQuotes = [
      tr(
        'Consistency made the crown possible. Now make it repeatable.',
        'بەردەوامی تاجەکەی بەدەست هێنا. ئێستا دووبارەی بکەرەوە.',
      ),
      tr(
        'Winning is a result. The habit that produced it is the real advantage.',
        'بردن ئەنجامە. ئەو عادەتەی دروستی کردووە سوودی ڕاستەقینەیە.',
      ),
      tr(
        'Keep the crown light: celebrate it, then get back to the work.',
        'تاجەکە سووک بگرە: پیرۆزی بکە، پاشان بگەڕێوە بۆ کار.',
      ),
    ]

    const challengerQuotes = [
      tr(
        'The crown is visible. The work to earn it starts quietly.',
        'تاجەکە دیارە. بەڵام کار بۆ بەدەستهێنانی بە بێدەنگی دەست پێ دەکات.',
      ),
      tr(
        'A fresh week is a clean scoreboard. One focused session starts the climb.',
        'هەفتەی نوێ ڕیزبەندییەکی پاکە. یەک سێشنی سەرنجدار دەستپێکی بەرزبوونەوەیە.',
      ),
      tr(
        'Do not chase the person above you. Chase a stronger version of your own week.',
        'بەدوای کەسی سەرەوەت مەکەوە. بەدوای هەفتەیەکی بەهێزتری خۆت بکەوە.',
      ),
    ]

    const source =
      currentUserWonLastWeek
        ? winnerQuotes
        : challengerQuotes
    const seed =
      lastWeekWinnerNames?.length ?? 0

    return source[
      seed % source.length
    ]
  })()

  const lastWeekWinningPoints =
    lastWeekWinners[0]?.points ?? 0

  const lastWeekWinningTime =
    lastWeekWinners[0]
      ? formatFocusedTime(
          lastWeekWinners[0].totalSeconds,
          language,
        )
      : null

  const leagueStatus =
    !profile.optIn
      ? tr('Not public', 'گشتی نییە')
      : !currentUser
        ? tr('Joining', 'بەشداربوون')
        : currentUser.rank === 1
          ? tr('Leader', 'سەرپێش')
          : currentUser.rank <= 3
            ? tr('Podium', 'سەکۆ')
            : currentUser.rank <= 10
              ? tr('Top 10', '١٠ یەکەم')
              : tr('Climbing', 'بەرزبوونەوە')

  const leagueStatusCopy =
    !profile.optIn
      ? tr('Your progress is saved. Rejoin whenever you want.', 'پێشکەوتنت پاشەکەوت کراوە. هەر کاتێک بتەوێت دووبارە بەشدار بە.')
      : !currentUser
        ? tr('Your public profile is syncing into the standings.', 'پڕۆفایلی گشتیت لەگەڵ ڕیزبەندی هاوکات دەکرێت.')
        : currentUser.rank === 1
          ? tr('Everyone is chasing you. Keep stacking deep days.', 'هەمووان بەدوای تۆدان. بەردەوام بە لە ڕۆژە قووڵەکان.')
          : currentUser.rank <= 3
            ? tr('You are on the podium. One strong day can change the order.', 'لە سەکۆدای. یەک ڕۆژی بەهێز دەتوانێت ڕیزبەندی بگۆڕێت.')
            : currentUser.rank <= 10
              ? tr('You are inside the top ten. The podium is the next target.', 'لە ناو ١٠ یەکەمدای. سەکۆ ئامانجی داهاتووە.')
              : tr('Every scored day closes the distance to the leaders.', 'هەر ڕۆژێکی خاڵدار دووری نێوان تۆ و سەرپێشەکان کەم دەکاتەوە.')

  return (
    <PageContainer>
      <PageHeader
        title={tr('FOCUS League', 'پێشبڕکێی FOCUS')}
        description={tr('A competitive layer for consistency. Build points, climb the board, and protect your momentum.', 'پێشبڕکێیەک بۆ بەردەوامی. خاڵ کۆبکەرەوە، لە ڕیزبەندی بەرزببەوە و ڕێتمەکەت بپارێزە.')}
      />

      {lastWeekWinnerNames && (
        <section
          className={`league-v4-champion-spotlight ${
            currentUserWonLastWeek
              ? 'is-winner'
              : ''
          }`}
        >
          <div className="league-v4-champion-badge">
            <Crown size={24} />
            {lastWeekTitleCount > 0 && (
              <strong>×{lastWeekTitleCount}</strong>
            )}
          </div>

          <div className="league-v4-champion-copy">
            <span className="league-v4-champion-kicker">
              {tr(
                "Last week's champion",
                'پاڵەوانی هەفتەی ڕابردوو',
              )}
              <b>{championTitle}</b>
            </span>
            <h3>
              {currentUserWonLastWeek
                ? tr(
                    `Congratulations, ${lastWeekWinnerNames}!`,
                    `پیرۆزە، ${lastWeekWinnerNames}!`,
                  )
                : tr(
                    `Congratulations to ${lastWeekWinnerNames}!`,
                    `پیرۆزە بۆ ${lastWeekWinnerNames}!`,
                  )}
            </h3>
            <p>
              {currentUserWonLastWeek
                ? tr(
                    'You earned the crown. Enjoy the win, then raise the standard again this week.',
                    'تاجەکەت بەدەستهێنا. چێژ لە بردنەکە ببینە، پاشان ئەم هەفتەیە ئاستەکە بەرزتر بکە.',
                  )
                : tr(
                    'The board has reset. A new week means a new chance to make the next champion announcement yours.',
                    'ڕیزبەندی دووبارە لە سفرەوە دەست پێ دەکات. هەفتەی نوێ هەلێکی نوێیە بۆ ئەوەی ئاگادارکردنەوەی پاڵەوانی داهاتوو بە ناوی تۆ بێت.',
                  )}
            </p>
            <blockquote>
              “{championMotivation}”
            </blockquote>
          </div>

          <div className="league-v4-champion-result">
            <strong>
              {tr(
                `${lastWeekWinningPoints} pts`,
                `${lastWeekWinningPoints} خاڵ`,
              )}
            </strong>
            {lastWeekWinningTime && (
              <span>
                {lastWeekWinningTime}{' '}
                {tr('focused', 'سەرنج')}
              </span>
            )}
          </div>
        </section>
      )}

      <section className="league-v4-hero">
        <div className="league-v4-orbit league-v4-orbit-a" />
        <div className="league-v4-orbit league-v4-orbit-b" />

        <div className="league-v4-hero-copy">
          <div className="league-v4-kicker">
            <Sparkles size={15} />
            {tr('Current standings', 'ڕیزبەندی ئێستا')}
            <span>
              {period === 'week'
                ? tr('Week', 'هەفتە')
                : tr('Month', 'مانگ')}
            </span>
          </div>

          <h2>
            {tr('Earn your place.', 'شوێنەکەت بەدەستبهێنە.')}
            <br />
            <span>{tr('Then defend it.', 'پاشان بپارێزە.')}</span>
          </h2>

          <p>
            {tr('Your League score rewards showing up and going deeper. Every completed focus session moves your public standing.', 'خاڵی پێشبڕکێ بۆ بەردەوامی و سەرنجی قووڵ پاداشتت دەدات. هەر سێشنێکی تەواوکراو ڕیزبەندی گشتیت دەگۆڕێت.')}
          </p>

          <div className="league-v4-rule-row">
            <div className="league-v4-rule neutral">
              <span className="league-v4-rule-points">0</span>
              <div>
                <strong>{tr('No study', 'هیچ خوێندنێک')}</strong>
                <small>{tr('day closes at 0 seconds', 'ڕۆژ بە ٠ چرکە دادەخرێت')}</small>
              </div>
            </div>

            <div className="league-v4-rule active">
              <span className="league-v4-rule-points">1</span>
              <div>
                <strong>{tr('Show up', 'دەست پێ بکە')}</strong>
                <small>{tr('1 second → 90 minutes', '١ چرکە → ٩٠ خولەک')}</small>
              </div>
            </div>

            <div className="league-v4-rule elite">
              <span className="league-v4-rule-points">3</span>
              <div>
                <strong>{tr('Deep day', 'ڕۆژی قووڵ')}</strong>
                <small>{tr('more than 90 minutes', 'زیاتر لە ٩٠ خولەک')}</small>
              </div>
            </div>
          </div>
        </div>

        <div className="league-v4-rank-core">
          <div className="league-v4-rank-glow" />
          <div className="league-v4-rank-ring">
            <span>{tr('Your rank', 'پلەی تۆ')}</span>
            <strong>{rankText}</strong>
            <small>{scoreText}</small>
          </div>

          <div className="league-v4-rank-target">
            <Target size={15} />
            <span>
              {currentUser?.rank === 1
                ? tr('Hold the lead', 'سەرپێشیت بپارێزە')
                : nextRank?.label ?? tr('Join to enter the race', 'بەشدار بە بۆ چوونە ناو پێشبڕکێ')}
            </span>
          </div>
        </div>
      </section>

      <div className="league-v4-period-bar">
        <div>
          <span>{tr('Time range', 'ماوەی کات')}</span>
          <strong>
            {period === 'week' ? tr('This week', 'ئەم هەفتەیە') : tr('This month', 'ئەم مانگە')}
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
              {item === 'week' ? tr('Week', 'هەفتە') : tr('Month', 'مانگ')}
            </button>
          ))}
        </div>
      </div>

      <section className="league-v4-podium-shell">
        <div className="league-v4-section-head">
          <div>
            <span>{tr('Podium', 'سەکۆ')}</span>
            <h3>{tr('Top three', 'سێ یەکەم')}</h3>
          </div>

          <div className="league-v4-live">
            <i />
            {tr('Live ranking', 'ڕیزبەندی ڕاستەوخۆ')}
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
                <span>{tr('Place', 'پلە')} {place}</span>
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
                  {entry ? entry.publicName : tr('Open position', 'شوێنی بەتاڵ')}
                </strong>
                {entry?.isCurrentUser && <span>{tr('You', 'تۆ')}</span>}
                {entry && isDefendingChampion(entry) && (
                  <span className="league-v4-defending-badge">
                    <ShieldCheck size={11} />
                    {tr(
                      'Defending champion',
                      'پاڵەوانی بەرگریکار',
                    )}
                  </span>
                )}
                {entry && championCountFor(entry) > 0 && (
                  <span
                    className={`league-v4-title-badge tier-${championTier(
                      championCountFor(entry),
                    )}`}
                    title={championTierLabel(
                      championCountFor(entry),
                      tr,
                    )}
                  >
                    <Crown size={11} />
                    ×{championCountFor(entry)}
                  </span>
                )}
              </div>

              <div className="league-v4-podium-score">
                {entry?.points ?? 0}
                <small>{tr('pts', 'خاڵ')}</small>
              </div>

              <div className="league-v4-podium-meta">
                <span>
                  <Flame size={13} />
                  {entry?.scoredDays ?? 0} {tr('scored days', 'ڕۆژی خاڵدار')}
                </span>
                <span>
                  <Clock size={13} />
                  {entry
                    ? formatFocusedTime(entry.totalSeconds, language)
                    : language === 'ku' ? '0 خولەک' : '0m'}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {period === 'week' && entries.length > 0 && (
        <section className="league-v4-title-race">
          <div className="league-v4-title-race-head">
            <div>
              <span>{tr('Live title race', 'پێشبڕکێی ڕاستەوخۆی ناونیشان')}</span>
              <h3>{tr('If the week ended now', 'ئەگەر هەفتەکە ئێستا کۆتایی بێت')}</h3>
            </div>
            <Trophy size={19} />
          </div>

          <div className="league-v4-title-race-list">
            {entries.slice(0, 3).map((entry) => {
              const leaderPoints =
                entries[0]?.points ?? 0
              const pointsBehind =
                Math.max(
                  0,
                  leaderPoints - entry.points,
                )

              return (
                <div
                  key={`title-race-${entry.publicName}-${entry.rank}`}
                  className={`league-v4-title-race-row ${
                    entry.rank === 1 ? 'is-leading' : ''
                  } ${
                    entry.isCurrentUser ? 'is-you' : ''
                  }`}
                >
                  <span className="league-v4-title-race-rank">
                    #{entry.rank}
                  </span>
                  <div className="league-v4-title-race-person">
                    <strong>
                      {entry.publicName}
                      {entry.isCurrentUser
                        ? ` · ${tr('You', 'تۆ')}`
                        : ''}
                    </strong>
                    <small>
                      {championCountFor(entry) > 0
                        ? tr(
                            `${championCountFor(entry)} career titles`,
                            `${championCountFor(entry)} ناونیشانی هەمیشەیی`,
                          )
                        : tr(
                            'Chasing a first title',
                            'بەدوای یەکەم ناونیشان',
                          )}
                    </small>
                  </div>
                  <div className="league-v4-title-race-score">
                    <strong>{entry.points}</strong>
                    <span>{tr('pts', 'خاڵ')}</span>
                  </div>
                  <span className="league-v4-title-race-gap">
                    {entry.rank === 1
                      ? tr('Leading', 'سەرپێش')
                      : tr(
                          `${pointsBehind} pts back`,
                          `${pointsBehind} خاڵ دواوە`,
                        )}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {seasonEntries.length > 0 && (
        <section className="league-v4-season-race">
          <div className="league-v4-season-head">
            <div>
              <span>
                {tr(
                  'FOCUS season',
                  'وەرزی FOCUS',
                )}
              </span>
              <h3>
                {tr(
                  'Season leaderboard',
                  'ڕیزبەندی وەرز',
                )}
              </h3>
              <small>
                {currentSeasonLabel(language)}
              </small>
            </div>
            <div className="league-v4-season-user">
              <span>
                {tr(
                  'Your season rank',
                  'پلەی وەرزی تۆ',
                )}
              </span>
              <strong>
                {seasonCurrentUser
                  ? `#${seasonCurrentUser.rank}`
                  : '—'}
              </strong>
            </div>
          </div>

          <div className="league-v4-season-list">
            {seasonEntries
              .slice(0, 5)
              .map((entry) => (
                <div
                  key={`season-${entry.publicName}-${entry.rank}`}
                  className={`league-v4-season-row ${
                    entry.rank === 1
                      ? 'is-leading'
                      : ''
                  } ${
                    entry.isCurrentUser
                      ? 'is-you'
                      : ''
                  }`}
                >
                  <span>#{entry.rank}</span>
                  <div>
                    <strong>
                      {entry.publicName}
                      {entry.isCurrentUser
                        ? ` · ${tr('You', 'تۆ')}`
                        : ''}
                    </strong>
                    <small>
                      {entry.scoredDays}{' '}
                      {tr(
                        'scored days',
                        'ڕۆژی خاڵدار',
                      )}{' '}
                      ·{' '}
                      {formatFocusedTime(
                        entry.totalSeconds,
                        language,
                      )}
                    </small>
                  </div>
                  <b>{entry.points}</b>
                  <small>{tr('pts', 'خاڵ')}</small>
                </div>
              ))}
          </div>

          <div className="league-v4-season-foot">
            <Trophy size={13} />
            <span>
              {seasonCurrentUser &&
              seasonLeader
                ? seasonCurrentUser.rank === 1
                  ? tr(
                      'You are leading the season. Protect the standard.',
                      'لە وەرزەکەدا سەرپێشیت. ئاستەکە بپارێزە.',
                    )
                  : tr(
                      `${seasonGap} pts separate you from the season lead.`,
                      `${seasonGap} خاڵ لە نێوان تۆ و سەرپێشی وەرزەکەدایە.`,
                    )
                : tr(
                    'Build scored days to enter the season race.',
                    'ڕۆژی خاڵدار دروست بکە بۆ چوونە ناو پێشبڕکێی وەرز.',
                  )}
            </span>
          </div>
        </section>
      )}

      <div className="league-v4-grid">
        <section className="league-v4-board">
          <div className="league-v4-section-head">
            <div>
              <span>{tr('Standings', 'ڕیزبەندی')}</span>
              <h3>
                {period === 'week' ? tr('Weekly standings', 'ڕیزبەندی هەفتانە') : tr('Monthly standings', 'ڕیزبەندی مانگانە')}
              </h3>
            </div>
            <Trophy size={20} />
          </div>

          {loading ? (
            <div className="league-v4-empty">{tr('Updating standings…', 'ڕیزبەندی نوێ دەکرێتەوە…')}</div>
          ) : entries.length === 0 ? (
            <div className="league-v4-empty">
              {tr('No public competitors yet. The first learner can claim the board.', 'هێشتا هیچ بەشداربوویەکی گشتی نییە. یەکەم خوێنەر دەتوانێت سەرەوەی ڕیزبەندی بگرێت.')}
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
                      {entry.isCurrentUser ? ` · ${tr('You', 'تۆ')}` : ''}
                    </strong>
                    {isDefendingChampion(entry) && (
                      <span className="league-v4-defending-badge">
                        <ShieldCheck size={11} />
                        {tr(
                          'Defending champion',
                          'پاڵەوانی بەرگریکار',
                        )}
                      </span>
                    )}
                    {championCountFor(entry) > 0 && (
                      <span
                        className={`league-v4-title-badge tier-${championTier(
                          championCountFor(entry),
                        )}`}
                        title={championTierLabel(
                          championCountFor(entry),
                          tr,
                        )}
                      >
                        <Crown size={11} />
                        {tr(
                          `×${championCountFor(entry)} champion`,
                          `×${championCountFor(entry)} پاڵەوان`,
                        )}
                      </span>
                    )}
                    <span>
                      {entry.scoredDays} {tr('scored days', 'ڕۆژی خاڵدار')} ·{' '}
                      {formatFocusedTime(entry.totalSeconds, language)} {tr('focused', 'سەرنج')}
                    </span>
                  </div>

                  <div className="league-v4-row-points">
                    <strong>{entry.points}</strong>
                    <span>{tr('pts', 'خاڵ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="league-v4-side">
          {profile.optIn && (
            <section className="league-v4-champion-profile">
              <div className="league-v4-champion-profile-head">
                <div>
                  <span>{tr('Champion profile', 'پڕۆفایلی پاڵەوان')}</span>
                  <h3>{profile.publicName || tr('Focused learner', 'خوێنەری سەرنجدار')}</h3>
                </div>
                <div
                  className={`league-v4-profile-crown tier-${championTier(
                    currentUserTitleCount,
                  )}`}
                >
                  <Crown size={18} />
                  <strong>×{currentUserTitleCount}</strong>
                </div>
              </div>

              <div className="league-v4-champion-profile-stats">
                <div>
                  <span>{tr('Titles', 'ناونیشانەکان')}</span>
                  <strong>{currentUserTitleCount}</strong>
                </div>
                <div>
                  <span>{tr('Level', 'ئاست')}</span>
                  <strong>
                    {currentUserTitleCount > 0
                      ? championTierLabel(
                          currentUserTitleCount,
                          tr,
                        )
                      : tr(
                          'First title waiting',
                          'چاوەڕوانی یەکەم ناونیشان',
                        )}
                  </strong>
                </div>
              </div>

              <div className="league-v4-champion-next">
                <div>
                  <span>
                    {tr(
                      'Next crown milestone',
                      'ئامانجی داهاتووی تاج',
                    )}
                  </span>
                  <strong>
                    ×{currentUserNextMilestone}
                  </strong>
                </div>
                <p>
                  {currentUserTitlesToMilestone === 1
                    ? tr(
                        'One more weekly title unlocks the next milestone.',
                        'یەک ناونیشانی هەفتانەی تر ئاستی داهاتوو دەکاتەوە.',
                      )
                    : tr(
                        `${currentUserTitlesToMilestone} more weekly titles to the next milestone.`,
                        `${currentUserTitlesToMilestone} ناونیشانی هەفتانەی تر بۆ ئاستی داهاتوو.`,
                      )}
                </p>
              </div>

              <div className="league-v4-champion-profile-foot">
                {currentUserLastTitle ? (
                  <>
                    <Trophy size={13} />
                    <span>
                      {tr(
                        `Last title: ${formatChampionWeek(
                          currentUserLastTitle.weekStart,
                          language,
                        )}`,
                        `دوا ناونیشان: ${formatChampionWeek(
                          currentUserLastTitle.weekStart,
                          language,
                        )}`,
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Target size={13} />
                    <span>
                      {tr(
                        'Your first crown is still available.',
                        'یەکەم تاجەکەت هێشتا بەردەستە.',
                      )}
                    </span>
                  </>
                )}
              </div>
            </section>
          )}

          <section className="league-v4-command">
            <div className="league-v4-command-head">
              <div>
                <span>{tr('Your League profile', 'پڕۆفایلی پێشبڕکێی تۆ')}</span>
                <h3>{profile.publicName || tr('Focused learner', 'خوێنەری سەرنجدار')}</h3>
              </div>
              <ShieldCheck size={21} />
            </div>

            {profile.optIn ? (
              <>
                <div className="league-v4-personal-stats">
                  <div>
                    <span>{tr('Rank', 'پلە')}</span>
                    <strong>{rankText}</strong>
                  </div>
                  <div>
                    <span>{tr('Score', 'خاڵ')}</span>
                    <strong>{scoreText}</strong>
                  </div>
                  <div>
                    <span>{tr('Focus', 'سەرنج')}</span>
                    <strong>{totalTimeText}</strong>
                  </div>
                  <div>
                    <span>{tr('Scored days', 'ڕۆژە خاڵدارەکان')}</span>
                    <strong>{scoredDaysText}</strong>
                  </div>
                </div>

                <div className="league-v4-next-move">
                  <div>
                    <Zap size={16} />
                    {tr('Next step', 'هەنگاوی داهاتوو')}
                  </div>
                  <strong>
                    {currentUser?.rank === 1
                      ? tr('Protect #1. Another deep day keeps pressure on everyone below.', 'پلەی #1 بپارێزە. ڕۆژێکی قووڵی تر فشار لەسەر هەمووانی خوارەوە دەهێڵێت.')
                      : nextRank?.label ??
                        tr('Keep studying to enter the rankings.', 'بەردەوام بە لە خوێندن بۆ چوونە ناو ڕیزبەندی.')}
                  </strong>
                </div>

                <div className="league-v4-status">
                  <div>
                    <span>{tr('Competition status', 'دۆخی پێشبڕکێ')}</span>
                    <strong>{leagueStatus}</strong>
                  </div>
                  <p>{leagueStatusCopy}</p>
                </div>

                <div className="league-v4-milestones">
                  <div className="complete">
                    <i />
                    <span>{tr('Joined', 'بەشدار')}</span>
                  </div>
                  <div
                    className={
                      currentUser && currentUser.points > 0 ? 'complete' : ''
                    }
                  >
                    <i />
                    <span>{tr('Scored', 'خاڵدار')}</span>
                  </div>
                  <div
                    className={
                      currentUser && currentUser.rank <= 3 ? 'complete' : ''
                    }
                  >
                    <i />
                    <span>{tr('Podium', 'سەکۆ')}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="league-v4-join-intro">
                <Trophy size={18} />
                <div>
                  <strong>
                    {tr('Join when you want competition.', 'کاتێک پێشبڕکێت دەوێت بەشدار بە.')}
                  </strong>
                  <span>
                    {tr('Your study data stays private. Only your public name and League totals appear in the standings.', 'داتای خوێندنت تایبەت دەمێنێتەوە. تەنها ناوی گشتی و کۆی داتای پێشبڕکێ لە ڕیزبەندیدا دەردەکەوێت.')}
                  </span>
                </div>
              </div>
            )}

            <label className="league-v4-field">
              <span>{tr('Public name', 'ناوی گشتی')}</span>
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
                      tr('Leave the League? You will be hidden from public standings, but your score and League progress will stay saved and return if you rejoin.', 'لە پێشبڕکێ دەردەچیت؟ لە ڕیزبەندی گشتی دەشاردرێیتەوە، بەڵام خاڵ و پێشکەوتنت پاشەکەوت دەمێننەوە و کاتێک دووبارە بەشدار بیت دەگەڕێنەوە.'),
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
                  {profile.optIn ? tr('Visible in standings', 'لە ڕیزبەندی دیارە') : tr('Join League', 'بەشداری پێشبڕکێ بکە')}
                </strong>
                <small>
                  {profile.optIn
                    ? tr('Leaving only hides your profile. Your League progress stays saved.', 'دەرچوون تەنها پڕۆفایلەکەت دەشارێتەوە. پێشکەوتنی پێشبڕکێت پاشەکەوت دەمێنێتەوە.')
                    : tr('You can leave later without losing your saved League progress.', 'دواتر دەتوانیت دەرچیت بەبێ لەدەستدانی پێشکەوتنی پاشەکەوتکراوی پێشبڕکێ.')}
                </small>
              </span>
            </label>

            <button
              type="button"
              className="cyber-btn league-v4-save"
              disabled={saving}
              onClick={() => void saveProfile()}
            >
              {saving ? tr('Saving…', 'پاشەکەوت دەکرێت…') : tr('Save League settings', 'ڕێکخستنەکانی پێشبڕکێ پاشەکەوت بکە')}
            </button>

            <div className="league-v4-privacy">
              <Lock size={14} />
              <span>
                {tr('Only your public name, score, scored-day count and aggregate focused time are visible. Email, subjects, notes and study history stay private.', 'تەنها ناوی گشتی، خاڵ، ژمارەی ڕۆژە خاڵدارەکان و کۆی کاتی سەرنجت دیارە. ئیمەیڵ، بابەتەکان، تێبینی و مێژووی خوێندن تایبەت دەمێننەوە.')}
              </span>
            </div>
          </section>

          <section className="league-v4-champions">
            <div className="league-v4-section-head compact">
              <div>
                <span>{tr('Previous results', 'ئەنجامەکانی پێشوو')}</span>
                <h3>{tr('Previous champions', 'پاڵەوانەکانی پێشوو')}</h3>
              </div>
              <Crown size={18} />
            </div>

            <div className="league-v4-champion-grid">
              <div>
                <span>{tr('Last week', 'هەفتەی ڕابردوو')}</span>
                <strong>{lastWeekChampion ?? tr('No winner yet', 'هێشتا براوە نییە')}</strong>
              </div>
              <div>
                <span>{tr('Last month', 'مانگی ڕابردوو')}</span>
                <strong>{lastMonthChampion ?? tr('No winner yet', 'هێشتا براوە نییە')}</strong>
              </div>
            </div>

            {championTitleCounts.size > 0 && (
              <>
                <div className="league-v4-title-record">
                  <div>
                    <span>
                      {tr(
                        'All-time title leader',
                        'سەرپێشی هەمیشەیی ناونیشان',
                      )}
                    </span>
                    <strong>
                      {recordHolders
                        .map(
                          (entry) =>
                            entry.publicName,
                        )
                        .join(' · ')}
                    </strong>
                  </div>
                  <b
                    className={`tier-${championTier(
                      recordTitleCount,
                    )}`}
                    title={championTierLabel(
                      recordTitleCount,
                      tr,
                    )}
                  >
                    <Crown size={14} />
                    ×{recordTitleCount}
                  </b>
                </div>

                <div className="league-v4-crown-tier-key">
                  <span className="tier-rookie">
                    <Crown size={11} />
                    {tr('1–2 titles', '١–٢ ناونیشان')}
                  </span>
                  <span className="tier-proven">
                    <Crown size={11} />
                    {tr('3–4 Proven', '٣–٤ سەلمێنراو')}
                  </span>
                  <span className="tier-elite">
                    <Crown size={11} />
                    {tr('5–9 Elite', '٥–٩ هەڵبژاردە')}
                  </span>
                  <span className="tier-legend">
                    <Crown size={11} />
                    {tr('10+ Legendary', '١٠+ ئەفسانەیی')}
                  </span>
                </div>

                <div className="league-v4-title-ledger">
                  {titleLeaders
                    .slice(0, 5)
                    .map((entry) => (
                      <span
                        key={entry.key}
                        className={`tier-${championTier(
                          entry.count,
                        )}`}
                        title={championTierLabel(
                          entry.count,
                          tr,
                        )}
                      >
                        <Crown size={12} />
                        {entry.publicName}
                        <b>×{entry.count}</b>
                      </span>
                    ))}
                </div>
              </>
            )}

            {championHistory.length > 0 && (
              <div className="league-v4-title-history">
                <div className="league-v4-title-history-head">
                  <span>
                    {tr(
                      'Title history',
                      'مێژووی پاڵەوانی',
                    )}
                  </span>
                  <small>
                    {tr(
                      'Recent weekly crowns',
                      'تاجە هەفتانە نوێیەکان',
                    )}
                  </small>
                </div>

                {championHistory
                  .slice(0, 6)
                  .map((winner) => (
                    <div
                      className="league-v4-title-history-row"
                      key={`${winner.weekStart}-${winner.publicName}-${winner.avatarSeed}`}
                    >
                      <span className="league-v4-history-crown">
                        <Crown size={12} />
                      </span>
                      <div>
                        <strong>
                          {winner.publicName}
                        </strong>
                        <small>
                          {formatChampionWeek(
                            winner.weekStart,
                            language,
                          )}
                        </small>
                      </div>
                      <span>
                        {winner.points}{' '}
                        {tr('pts', 'خاڵ')}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {championHallRows.length > 0 && (
            <section className="league-v4-hall-of-champions">
              <div className="league-v4-section-head compact">
                <div>
                  <span>
                    {tr(
                      'Legacy table',
                      'خشتەی مێژوویی',
                    )}
                  </span>
                  <h3>
                    {tr(
                      'Hall of Champions',
                      'هۆڵی پاڵەوانان',
                    )}
                  </h3>
                </div>
                <Trophy size={18} />
              </div>

              <div className="league-v4-hall-list">
                {championHallRows.map((champion) => (
                  <div
                    key={champion.key}
                    className={`league-v4-hall-row ${
                      champion.rank === 1
                        ? 'is-record'
                        : ''
                    }`}
                  >
                    <span className="league-v4-hall-rank">
                      #{champion.rank}
                    </span>

                    <div className="league-v4-hall-person">
                      <strong>
                        {champion.publicName}
                      </strong>
                      <small>
                        {champion.latestTitle
                          ? tr(
                              `Latest crown ${formatChampionWeek(
                                champion.latestTitle.weekStart,
                                language,
                              )}`,
                              `دوا تاج ${formatChampionWeek(
                                champion.latestTitle.weekStart,
                                language,
                              )}`,
                            )
                          : tr(
                              'Champion history',
                              'مێژووی پاڵەوانی',
                            )}
                      </small>
                    </div>

                    <span
                      className={`league-v4-hall-crowns tier-${championTier(
                        champion.count,
                      )}`}
                      title={championTierLabel(
                        champion.count,
                        tr,
                      )}
                    >
                      <Crown size={13} />
                      <b>×{champion.count}</b>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {message && (
            <div className="league-v4-message">{message}</div>
          )}
        </aside>
      </div>
    </PageContainer>
  )
}
