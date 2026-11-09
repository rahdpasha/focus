import { useEffect, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import { useI18n } from '../../useI18n'

/**
 * Home Screen PWAs can keep an old document running after a new deploy.
 * The entry-script comparison also finds new releases when the service
 * worker did not change or iOS postponed its lifecycle events.
 *
 * Never auto-reload: a focus timer or an unsent Muse edit may be in progress.
 */
export default function PwaUpdateNotice() {
  const { tr } = useI18n()
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let mounted = true
    let checking = false
    let lastCheck = 0
    let currentController = navigator.serviceWorker.controller
    let registration: ServiceWorkerRegistration | null = null

    const onControllerChange = () => {
      const nextController = navigator.serviceWorker.controller
      if (mounted && currentController && nextController &&
          currentController !== nextController) {
        setUpdateAvailable(true)
      }
      currentController = nextController
    }

    const checkVersion = async () => {
      if (!mounted || !navigator.onLine || document.visibilityState === 'hidden' ||
          checking || Date.now() - lastCheck < 15000) return
      checking = true
      lastCheck = Date.now()
      try {
        // Explicit update check on resume: installed iOS PWAs may not navigate
        // for days and may otherwise continue to show the previous bundle.
        if (registration) {
          await registration.update()
          if (registration.waiting && navigator.serviceWorker.controller) {
            if (mounted) setUpdateAvailable(true)
          }
        }

        // Service-worker byte checks alone miss new builds when sw.js is
        // unchanged. Compare the Vite hashed entry bundle with production.
        const response = await fetch('/index.html', { cache: 'no-store' })
        if (!response.ok) return
        const html = await response.text()
        const remote = new DOMParser().parseFromString(html, 'text/html')
          .querySelector<HTMLScriptElement>('script[type="module"][src]')?.getAttribute('src')
        const local = document.querySelector<HTMLScriptElement>('script[type="module"][src]')
          ?.getAttribute('src')
        if (mounted && remote && local &&
            new URL(remote, location.href).pathname !== new URL(local, location.href).pathname) {
          setUpdateAvailable(true)
        }
      } catch {
        // Offline and transient network failures must not block FOCUS/MUSE.
      } finally {
        checking = false
      }
    }

    const onResume = () => { void checkVersion() }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onResume()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onResume)
    window.addEventListener('focus', onResume)
    window.addEventListener('online', onResume)
    const interval = window.setInterval(onResume, 5 * 60 * 1000)

    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((found) => {
        registration = found
        if (mounted) void checkVersion()
      })
      .catch(() => {
        // Running without offline support must not prevent the app loading.
      })

    return () => {
      mounted = false
      window.clearInterval(interval)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onResume)
      window.removeEventListener('focus', onResume)
      window.removeEventListener('online', onResume)
    }
  }, [])

  if (!updateAvailable) return null

  return (
    <aside className="pwa-update-notice" role="status" aria-live="polite">
      <span>{tr('A new FOCUS version is ready.', 'وەشانێکی نوێی FOCUS ئامادەیە.')}</span>
      <button type="button" onClick={() => window.location.reload()}>
        <RefreshCcw size={16} aria-hidden="true" />
        {tr('Refresh app', 'ئەپەکە نوێ بکەرەوە')}
      </button>
    </aside>
  )
}
