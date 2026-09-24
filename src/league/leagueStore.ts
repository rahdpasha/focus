import { supabase } from '../api/supabaseClient'

export type LeaguePeriod = 'week' | 'month'

export interface LeagueProfile {
  publicName: string
  optIn: boolean
  timezone: string
  avatarSeed: string
}

export interface LeagueEntry {
  rank: number
  publicName: string
  avatarSeed: string
  points: number
  completedDays: number
  isCurrentUser: boolean
}

type LeagueRow = {
  rank: number | string
  public_name: string
  avatar_seed: string | null
  points: number | string
  completed_days: number | string
  is_current_user: boolean
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('Cloud features are not configured.')
  }

  return supabase
}

function dateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function loadLeagueProfile(
  userId: string,
  fallbackName = 'Focused learner',
): Promise<LeagueProfile> {
  const client = requireSupabase()

  const { data, error } = await client
    .from('profiles')
    .select(
      'public_name, display_name, leaderboard_opt_in, timezone, avatar_seed',
    )
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error

  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

  return {
    publicName:
      data?.public_name?.trim() ||
      data?.display_name?.trim() ||
      fallbackName,
    optIn: Boolean(data?.leaderboard_opt_in),
    timezone: data?.timezone || timezone,
    avatarSeed:
      data?.avatar_seed ||
      data?.public_name ||
      data?.display_name ||
      fallbackName,
  }
}

export async function saveLeagueProfile(
  userId: string,
  profile: LeagueProfile,
): Promise<void> {
  const client = requireSupabase()

  const publicName = profile.publicName.trim().slice(0, 40)

  if (publicName.length < 2) {
    throw new Error('Public name must be at least 2 characters.')
  }

  const { error } = await client
    .from('profiles')
    .upsert(
      {
        id: userId,
        public_name: publicName,
        leaderboard_opt_in: profile.optIn,
        timezone: profile.timezone || 'UTC',
        avatar_seed: profile.avatarSeed || publicName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

  if (error) throw error
}

export async function refreshLeagueHistory(days = 90): Promise<void> {
  const client = requireSupabase()

  const { error } = await client.rpc('refresh_my_league_history', {
    p_days: Math.max(1, Math.min(370, Math.round(days))),
  })

  if (error) throw error
}

export async function getLeaderboard(
  period: LeaguePeriod,
  referenceDate = new Date(),
): Promise<LeagueEntry[]> {
  const client = requireSupabase()

  const { data, error } = await client.rpc('get_leaderboard', {
    p_period: period,
    p_reference_date: dateOnly(referenceDate),
  })

  if (error) throw error

  return ((data ?? []) as LeagueRow[]).map((row) => ({
    rank: Number(row.rank),
    publicName: row.public_name,
    avatarSeed: row.avatar_seed ?? row.public_name,
    points: Number(row.points),
    completedDays: Number(row.completed_days),
    isCurrentUser: Boolean(row.is_current_user),
  }))
}
