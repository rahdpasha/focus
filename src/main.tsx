import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n'
import { ThemeProvider } from './app/theme'
import AppErrorBoundary from './components/system/AppErrorBoundary'

createRoot(
  document.getElementById('root')!
).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(
      '/sw.js'
    )
  })
}
