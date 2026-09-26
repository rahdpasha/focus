import { createClient } from '@supabase/supabase-js'

const defaultSupabaseUrl =
  'https://rvzzieqynxybjccbutvs.supabase.co'
const defaultSupabasePublishableKey =
  'sb_publishable_mQ3IMhRT_9IV6TxyaEV_Iw_7u4SpE03'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  defaultSupabaseUrl

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  defaultSupabasePublishableKey

const isConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabasePublishableKey) &&
  supabaseUrl !== 'YOUR_PROJECT_URL' &&
  supabasePublishableKey !== 'YOUR_PUBLISHABLE_KEY'

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null

export function isSupabaseConfigured(): boolean {
  return isConfigured
}
