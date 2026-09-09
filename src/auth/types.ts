export type AuthStatus = 'authenticated' | 'signed-out' | 'loading'

export interface AuthUser {
  id: string
  email?: string
  displayName?: string
}

export interface AuthSession {
  user: AuthUser
  accessToken?: string
  expiresAt?: string
}

export interface AuthState {
  status: AuthStatus
  session: AuthSession | null
}

export interface AuthProvider {
  getSession(): Promise<AuthSession | null>
  signIn(): Promise<AuthSession>
  signOut(): Promise<void>
}
