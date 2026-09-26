import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useI18n } from '../../useI18n'

function getAuthMessage(
  error: unknown,
  tr: (english: string, kurdish: string) => string,
): string {
  if (error && typeof error === 'object') {
    const authError = error as {
      code?: string
      status?: number
      message?: string
    }

    if (
      authError.code === 'over_email_send_rate_limit' ||
      authError.status === 429 ||
      authError.message
        ?.toLowerCase()
        .includes('email rate limit')
    ) {
      return tr(
        'FOCUS has temporarily reached its email sending limit. Please try again later. Your account data is safe.',
        'FOCUS بە کاتی سنووری ناردنی ئیمەیڵی پڕ کردووە. تکایە دواتر هەوڵ بدەوە. داتای هەژمارەکەت پارێزراوە.',
      )
    }

    if (authError.code === 'email_not_confirmed') {
      return tr(
        'Please confirm your email before signing in.',
        'تکایە پێش چوونەژوورەوە ئیمەیڵەکەت پشتڕاست بکەرەوە.',
      )
    }

    if (
      authError.code === 'invalid_credentials' ||
      authError.message
        ?.toLowerCase()
        .includes('invalid login credentials')
    ) {
      return tr(
        'The email or password is incorrect.',
        'ئیمەیڵ یان وشەی نهێنی هەڵەیە.',
      )
    }

    if (authError.message) {
      return authError.message
    }
  }

  return tr(
    'Authentication failed. Please try again.',
    'چوونەژوورەوە سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەوە.',
  )
}

export default function AuthScreen() {
  const { tr } = useI18n()
  const { signIn, signUp } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const submitLock = useRef(false)

  const signingUp = mode === 'signup'
  const passwordReady = !signingUp || password.length >= 10

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (submitLock.current) return

    submitLock.current = true
    setMessage('')

    const cleanEmail = email.trim()
    const cleanName = displayName.trim()

    if (signingUp && !cleanName) {
      submitLock.current = false
      setMessage(
        tr(
          'Add a display name before creating your account.',
          'پێش دروستکردنی هەژمار ناوی پیشاندانت زیاد بکە.',
        ),
      )
      return
    }

    if (!passwordReady) {
      submitLock.current = false
      setMessage(
        tr(
          'Use at least 10 characters for a new password.',
          'بۆ وشەی نهێنی نوێ لانیکەم ١٠ پیت بەکاربهێنە.',
        ),
      )
      return
    }

    setLoading(true)

    try {
      if (mode === 'signin') {
        await signIn(cleanEmail, password)
      } else {
        const session = await signUp(
          cleanEmail,
          password,
          cleanName,
        )

        setMessage(
          session
            ? tr(
                'Account created successfully.',
                'هەژمارەکەت بە سەرکەوتوویی دروست کرا.',
              )
            : tr(
                'Account created. Check your email to confirm your account.',
                'هەژمارەکەت دروست کرا. ئیمەیڵەکەت بپشکنە بۆ پشتڕاستکردنەوە.',
              ),
        )
      }
    } catch (error) {
      setMessage(getAuthMessage(error, tr))
    } finally {
      submitLock.current = false
      setLoading(false)
    }
  }

  const changeMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setMessage('')
    setPassword('')
    setShowPassword(false)
  }

  return (
    <main className="auth-screen">
      <section className="auth-shell">
        <aside className="auth-intro">
          <div className="auth-mark">F</div>

          <div>
            <div className="eyebrow">
              {tr('Your focus workspace', 'شوێنی کاری سەرنجت')}
            </div>

            <h1>
              {tr(
                'Build a system you can actually return to.',
                'سیستەمێک دروست بکە کە بتوانیت بەردەوام بگەڕێیتەوە بۆی.',
              )}
            </h1>

            <p>
              {tr(
                'Focus sessions, plans, routines, progress and guidance stay connected in one calm workspace.',
                'سێشنەکانی سەرنج، پلان، ڕوتین، پێشکەوتن و ڕێنمایی هەموویان لە یەک شوێنی ئارامدا پێکەوە دەمێننەوە.',
              )}
            </p>
          </div>

          <div className="auth-trust">
            <ShieldCheck size={17} />
            <span>
              {tr(
                'Your private study data stays tied to your account and is never shown on public League profiles.',
                'داتای تایبەتی خوێندنت تەنها بە هەژمارەکەتەوە پەیوەستە و لە پڕۆفایلی گشتی پێشبڕکێدا پیشان نادرێت.',
              )}
            </span>
          </div>
        </aside>

        <form
          onSubmit={submit}
          className="glass-panel auth-card"
        >
          <div className="auth-card-head">
            <span>FOCUS</span>

            <h2>
              {signingUp
                ? tr('Create your account', 'هەژمارەکەت دروست بکە')
                : tr('Welcome back', 'بەخێربێیتەوە')}
            </h2>

            <p>
              {signingUp
                ? tr(
                    'Create your account and keep your study system synced across devices.',
                    'هەژمارەکەت دروست بکە و سیستەمی خوێندنت لە نێوان ئامێرەکان هاوکات بپارێزە.',
                  )
                : tr(
                    'Pick up exactly where you left off.',
                    'لە هەمان شوێنەوە بەردەوام بە کە وەستابوویت.',
                  )}
            </p>
          </div>

          {signingUp && (
            <label className="auth-field">
              <span>{tr('Display name', 'ناوی پیشاندان')}</span>

              <div className="auth-input-wrap">
                <UserRound size={16} />
                <input
                  value={displayName}
                  onChange={(event) =>
                    setDisplayName(event.target.value)
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
            <span>{tr('Email', 'ئیمەیڵ')}</span>

            <div className="auth-input-wrap">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span>{tr('Password', 'وشەی نهێنی')}</span>

            <div className="auth-input-wrap">
              <LockKeyhole size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
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
                minLength={signingUp ? 10 : undefined}
                required
              />

              <button
                type="button"
                className="auth-password-toggle"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                aria-label={
                  showPassword
                    ? tr('Hide password', 'وشەی نهێنی بشارەوە')
                    : tr('Show password', 'وشەی نهێنی پیشان بدە')
                }
              >
                {showPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>

            {signingUp && (
              <small
                className={
                  password.length === 0
                    ? ''
                    : passwordReady
                      ? 'ready'
                      : 'warning'
                }
              >
                {tr(
                  'Use 10+ characters. A longer unique password is better.',
                  '١٠ پیت یان زیاتر بەکاربهێنە. وشەی نهێنی درێژ و تایبەت باشترە.',
                )}
              </small>
            )}
          </label>

          <button
            type="submit"
            className="cyber-btn auth-submit"
            disabled={loading || !passwordReady}
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
              : tr(
                  'Already have an account? Sign in',
                  'هەژمارت هەیە؟ بچۆ ژوورەوە',
                )}
          </button>
        </form>
      </section>
    </main>
  )
}
