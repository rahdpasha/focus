import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../api/supabaseClient'
import { SupabaseAuthProvider } from './provider'
import type { AuthSession, AuthState } from './types'

const provider = new SupabaseAuthProvider()

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<AuthSession | null>
  signOut: () => Promise<void>
} {
  const [state, setState] = useState<AuthState>({
    status: supabase ? 'loading' : 'signed-out',
    session: null,
  })

  useEffect(() => {
    if (!supabase) {
      return
    }

    let mounted = true

    provider.getSession().then((session) => {
      if (!mounted) return

      setState({
        status: session ? 'authenticated' : 'signed-out',
        session,
      })
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      if (!session) {
        setState({
          status: 'signed-out',
          session: null,
        })
        return
      }

      setState({
        status: 'authenticated',
        session: {
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
        },
      })
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await provider.signIn(email, password)

    setState({
      status: 'authenticated',
      session,
    })
  }, [])

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string,
    ) => {
      const session = await provider.signUp(
        email,
        password,
        displayName,
      )

      if (session) {
        setState({
          status: 'authenticated',
          session,
        })
      }

      return session
    },
    [],
  )

  const signOut = useCallback(async () => {
    await provider.signOut()

    setState({
      status: 'signed-out',
      session: null,
    })
  }, [])

  return {
    ...state,
    signIn,
    signUp,
    signOut,
  }
}
