import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        const session = await signUp(
          email,
          password,
          displayName,
        )

        setMessage(
          session
            ? 'Account created successfully.'
            : 'Account created. Check your email to confirm your account.',
        )
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Authentication failed.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: 'var(--void-bg)',
      }}
    >
      <form
        onSubmit={submit}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            FOCUS
          </div>

          <div style={{ color: 'var(--text-secondary)' }}>
            {mode === 'signin'
              ? 'Sign in to continue your study journey.'
              : 'Create your FOCUS account.'}
          </div>
        </div>

        {mode === 'signup' && (
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Display name"
            autoComplete="name"
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--void-border)',
              background: 'var(--void-surface-hover)',
              color: 'var(--text-primary)',
            }}
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          autoComplete="email"
          required
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--void-border)',
            background: 'var(--void-surface-hover)',
            color: 'var(--text-primary)',
          }}
        />

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete={
            mode === 'signin'
              ? 'current-password'
              : 'new-password'
          }
          minLength={6}
          required
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--void-border)',
            background: 'var(--void-surface-hover)',
            color: 'var(--text-primary)',
          }}
        />

        <button
          type="submit"
          className="cyber-btn"
          disabled={loading}
        >
          {loading
            ? 'PLEASE WAIT...'
            : mode === 'signin'
              ? 'SIGN IN'
              : 'CREATE ACCOUNT'}
        </button>

        {message && (
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setMessage('')
          }}
          style={{
            border: 0,
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          {mode === 'signin'
            ? 'Create a new account'
            : 'Already have an account? Sign in'}
        </button>
      </form>
    </main>
  )
}
