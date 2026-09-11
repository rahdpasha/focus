import type { Session } from '@supabase/supabase-js'
import { supabase } from '../api/supabaseClient'
import type { AuthProvider, AuthSession } from './types'

function mapSession(session: Session | null): AuthSession | null {
  if (!session) return null

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? undefined,
      displayName:
        typeof session.user.user_metadata?.display_name === 'string'
          ? session.user.user_metadata.display_name
          : undefined,
    },
    accessToken: session.access_token,
    expiresAt: session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : undefined,
  }
}

export class SupabaseAuthProvider implements AuthProvider {
  async getSession(): Promise<AuthSession | null> {
    if (!supabase) return null

    const { data, error } = await supabase.auth.getSession()

    if (error) throw error

    return mapSession(data.session)
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    if (!supabase) {
      throw new Error('Supabase is not configured')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    const session = mapSession(data.session)

    if (!session) {
      throw new Error('Authentication succeeded but no session was returned')
    }

    return session
  }

  async signUp(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<AuthSession | null> {
    if (!supabase) {
      throw new Error('Supabase is not configured')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName ?? '',
        },
      },
    })

    if (error) throw error

    return mapSession(data.session)
  }

  async signOut(): Promise<void> {
    if (!supabase) return

    const { error } = await supabase.auth.signOut()

    if (error) throw error
  }
}

export class UnconfiguredAuthProvider implements AuthProvider {
  async getSession(): Promise<AuthSession | null> {
    return null
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<AuthSession> {
    void email
    void password
    throw new Error('Authentication provider is not configured')
  }

  async signUp(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<AuthSession | null> {
    void email
    void password
    void displayName
    throw new Error('Authentication provider is not configured')
  }

  async signOut(): Promise<void> {
    return
  }
}
