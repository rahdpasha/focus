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
            Recovery mode
          </div>

          <h1>
            FOCUS hit an unexpected
            problem.
          </h1>

          <p>
            Your saved study data is
            not cleared. Reload the
            app to recover the latest
            local or synced state.
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
            Reload FOCUS
          </button>
        </section>
      </main>
    )
  }
}
