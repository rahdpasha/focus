import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

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
