import { Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../../useI18n'

function getInitialTheme() {
  return localStorage.getItem('theme') === 'light'
}

export default function ThemeToggle() {
  const { tr } = useI18n()
  const [isDark, setIsDark] = useState(() => !getInitialTheme())

  const toggle = () => {
    const newIsDark = !isDark
    const newTheme = newIsDark ? 'dark' : 'light'

    setIsDark(newIsDark)
    document.documentElement.setAttribute(
      'data-theme',
      newTheme
    )
    localStorage.setItem('theme', newTheme)
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={
        isDark
          ? tr('Switch to light theme', 'بگۆڕە بۆ ڕووکاری ڕووناک')
          : tr('Switch to dark theme', 'بگۆڕە بۆ ڕووکاری تاریک')
      }
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}