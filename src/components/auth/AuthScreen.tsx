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
import { useI18n } from '../../useI18n'

export default function AuthScreen() {
  const { tr } = useI18n()
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

  const [email, set{tr('Email', 'ئیمەیڵ')}] =
    useState('')
  const [
    password,
    set{tr('Password', 'وشەی نهێنی')},
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
        tr('Add a display name before creating your account.', 'پێش دروستکردنی هەژمار ناوی پیشاندانت زیاد بکە.'),
      )
      return
    }

    if (!passwordReady) {
      setMessage(
        tr('Use at least 10 characters for a new password.', 'بۆ وشەی نهێنی نوێ لانیکەم ١٠ پیت بەکاربهێنە.'),
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
            ? tr('Account created successfully.', 'هەژمارەکەت بە سەرکەوتوویی دروست کرا.')
            : tr('Account created. Check your email to confirm your account.', 'هەژمارەکەت دروست کرا. ئیمەیڵەکەت بپشکنە بۆ پشتڕاستکردنەوە.'),
        )
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : tr('Authentication failed.', 'چوونەژوورەوە سەرکەوتوو نەبوو.'),
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
              {tr('Your focus workspace', 'شوێنی کاری سەرنجت')}
            </div>

            <h1>
              {tr('Build a system you can actually return to.', 'سیستەمێک دروست بکە کە بتوانیت هەمیشە بگەڕێیتەوە بۆی.')}
            </h1>

            <p>
              {tr('Focus sessions, plans, routines, progress and guidance stay connected in one calm workspace.', 'سێشنەکانی سەرنج، پلان، ڕوتین، پێشکەوتن و ڕێنمایی هەموویان لە یەک شوێنی ئارامدا پێکەوە دەبن.')}
            </p>
          </div>

          <div className="auth-trust">
            <ShieldCheck
              size={17}
            />
            <span>
              {tr('Your private study data stays tied to your account and is never shown on public League profiles.', 'داتای تایبەتی خوێندنت تەنها بە هەژمارەکەتەوە پەیوەستە و لە پڕۆفایلی گشتی پێشبڕکێدا پیشان نادرێت.')}
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
                ? tr('Create your account', 'هەژمارەکەت دروست بکە')
                : tr('Welcome back', 'بەخێربێیتەوە')}
            </h2>

            <p>
              {signingUp
                ? tr('Create your account and keep your study system synced across devices.', 'هەژمارەکەت دروست بکە و سیستەمی خوێندنت لە نێوان ئامێرەکان هاوکات بێت.')
                : tr('Pick up exactly where you left off.', 'لە هەمان شوێنەوە بەردەوام بە کە وەستابوویت.')}}
            </p>
          </div>

          {signingUp && (
            <label className="auth-field">
              <span>
                {tr('Display name', 'ناوی پیشاندان')}
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
                  placeholder={tr('Your name', 'ناوت')}
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
                    ? tr('At least 10 characters', 'لانیکەم ١٠ پیت')
                    : tr('Your password', 'وشەی نهێنیت')
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
                    ? tr('Hide password', 'وشەی نهێنی بشارەوە')
                    : tr('Show password', 'وشەی نهێنی پیشان بدە')
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
                {tr('Use 10+ characters. A longer unique password is better.', '١٠ پیت یان زیاتر بەکاربهێنە. وشەی نهێنی درێژ و تایبەت باشترە.')}
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
              ? tr('Please wait…', 'تکایە چاوەڕێ بکە…')
              : mode === 'signin'
                ? tr('Sign in', 'چوونەژوورەوە')
                : tr('Create account', 'دروستکردنی هەژمار')}
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
              ? tr('Create a new account', 'هەژمارێکی نوێ دروست بکە')
              : tr('Already have an account? Sign in', 'هەژمارت هەیە؟ بچۆ ژوورەوە')}
          </button>
        </form>
      </section>
    </main>
  )
}
