import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './calm.css'
import './appearance.css'
import LivingBackground from './components/layout/LivingBackground'
import App from './App.tsx'
import { I18nProvider } from './i18n'
import { ThemeProvider } from './app/theme'
import AppErrorBoundary from './components/system/AppErrorBoundary'
import PwaUpdateNotice from './components/system/PwaUpdateNotice'

createRoot(
  document.getElementById('root')!
).render(
  <StrictMode>
    <ThemeProvider>
      <LivingBackground />
      <I18nProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
        <PwaUpdateNotice />
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)

