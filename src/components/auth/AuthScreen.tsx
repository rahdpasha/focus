import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import {
  useState,
} from 'react'
import {
  useAuth,
} from '../../auth/useAuth'

export default function AuthScreen() {
  const {
    signIn,
    signUp,
  } = useAuth()

  const [
    mode,
    setMode,
  ] = useState<
    'signin' | 'signup'
  >('signin')

  const [email, setEmail] =
    useState('')
  const [
    password,
    setPassword,
  ] = useState('')
  const [
    displayName,
    setDisplayName,
  ] = useState('')
  const [
    message,
    setMessage,
  ] = useState('')
  const [
    loading,
    setLoading,
  ] = useState(false)
  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const signingUp =
    mode === 'signup'

  const passwordReady =
    !signingUp ||
    password.length >= 10

  const submit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault()
    setMessage('')

    const cleanEmail =
      email.trim()
    const cleanName =
      displayName.trim()

    if (
      signingUp &&
      !cleanName
    ) {
      setMessage(
        'Add a display name before creating your account.',
      )
      return
    }

    if (!passwordReady) {
      setMessage(
        'Use at least 10 characters for a new password.',
      )
      return
    }

    setLoading(true)

    try {
      if (mode === 'signin') {
        await signIn(
          cleanEmail,
          password,
        )
      } else {
        const session =
          await signUp(
            cleanEmail,
            password,
            cleanName,
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

  const changeMode = () => {
    setMode(
      mode === 'signin'
        ? 'signup'
        : 'signin',
    )
    setMessage('')
    setPassword('')
    setShowPassword(false)
  }

  return (
    <main className="auth-screen">
      <section className="auth-shell">
        <aside className="auth-intro">
          <div className="auth-mark">
            F
          </div>

          <div>
            <div className="eyebrow">
              Your focus workspace
            </div>

            <h1>
              Build a system you can
              actually return to.
            </h1>

            <p>
              Focus sessions, plans, routines, progress and guidance stay connected in one calm workspace.
            </p>
          </div>

          <div className="auth-trust">
            <ShieldCheck
              size={17}
            />
            <span>
              Your private study data stays tied to your account and is never shown on public League profiles.
            </span>
          </div>
        </aside>

        <form
          onSubmit={submit}
          className="glass-panel auth-card"
        >
          <div className="auth-card-head">
            <span>
              FOCUS
            </span>

            <h2>
              {signingUp
                ? 'Create your account'
                : 'Welcome back'}
            </h2>

            <p>
              {signingUp
                ? 'Create your account and keep your study system synced across devices.'
                : 'Pick up exactly where you left off.'}
            </p>
          </div>

          {signingUp && (
            <label className="auth-field">
              <span>
                Display name
              </span>

              <div className="auth-input-wrap">
                <UserRound
                  size={16}
                />
                <input
                  value={
                    displayName
                  }
                  onChange={(
                    event,
                  ) =>
                    setDisplayName(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Your name"
                  autoComplete="name"
                  maxLength={60}
                  required
                />
              </div>
            </label>
          )}

          <label className="auth-field">
            <span>
              Email
            </span>

            <div className="auth-input-wrap">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(
                  event,
                ) =>
                  setEmail(
                    event.target
                      .value,
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span>
              Password
            </span>

            <div className="auth-input-wrap">
              <LockKeyhole
                size={16}
              />
              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                value={password}
                onChange={(
                  event,
                ) =>
                  setPassword(
                    event.target
                      .value,
                  )
                }
                placeholder={
                  signingUp
                    ? 'At least 10 characters'
                    : 'Your password'
                }
                autoComplete={
                  mode === 'signin'
                    ? 'current-password'
                    : 'new-password'
                }
                minLength={
                  signingUp
                    ? 10
                    : undefined
                }
                required
              />

              <button
                type="button"
                className="auth-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (value) =>
                      !value,
                  )
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff
                    size={16}
                  />
                ) : (
                  <Eye
                    size={16}
                  />
                )}
              </button>
            </div>

            {signingUp && (
              <small
                className={
                  password.length ===
                  0
                    ? ''
                    : passwordReady
                      ? 'ready'
                      : 'warning'
                }
              >
                Use 10+ characters.
                A longer unique
                password is better.
              </small>
            )}
          </label>

          <button
            type="submit"
            className="cyber-btn auth-submit"
            disabled={
              loading ||
              !passwordReady
            }
          >
            {loading
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </button>

          {message && (
            <div
              className="auth-message"
              role="status"
              aria-live="polite"
            >
              {message}
            </div>
          )}

          <button
            type="button"
            className="auth-mode-switch"
            onClick={changeMode}
          >
            {mode === 'signin'
              ? 'Create a new account'
              : 'Already have an account? Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
