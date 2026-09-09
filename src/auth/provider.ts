import type { AuthProvider, AuthSession } from './types'

export class UnconfiguredAuthProvider implements AuthProvider {
  async getSession(): Promise<AuthSession | null> {
    return null
  }

  async signIn(): Promise<AuthSession> {
    throw new Error('Authentication provider is not configured')
  }

  async signOut(): Promise<void> {
    return
  }
}
