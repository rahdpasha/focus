import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import {
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class AppErrorBoundary extends Component<
  Props,
  State
> {
  state: State = {
    hasError: false,
  }

  static getDerivedStateFromError(): State {
    return {
      hasError: true,
    }
  }

  componentDidCatch(
    error: Error,
    info: ErrorInfo,
  ) {
    console.error(
      'FOCUS application error:',
      error,
      info,
    )
  }

  render() {
    const isKurdish =
      document.documentElement.lang === 'ku'
    const tr = (
      english: string,
      kurdish: string,
    ) =>
      isKurdish
        ? kurdish
        : english

    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="fatal-error-screen">
        <section className="glass-panel fatal-error-card">
          <div className="fatal-error-icon">
            <ShieldAlert
              size={24}
            />
          </div>

          <div className="eyebrow">
            {tr('App recovery', 'گەڕاندنەوەی بەرنامە')}
          </div>

          <h1>
            {tr('Something went wrong.', 'هەڵەیەک ڕوویدا.')}
          </h1>

          <p>
            {tr('Your saved study data is still safe. Reload app to restore the latest local or synced state.', 'داتای خوێدنی پاشەکەوتکراوت پارێزراوە. بەرنامەکە نوێ بکەرەوە بۆ گەڕاندنەوەی دوا دۆخی ناوخۆیی یان هاوکاتکراو.')}
          </p>

          <button
            type="button"
            className="cyber-btn"
            onClick={() =>
              window.location.reload()
            }
          >
            <RefreshCcw
              size={15}
            />
            {tr('Reload FOCUS', 'FOCUS نوێ بکەرەوە')}
          </button>
        </section>
      </main>
    )
  }
}
