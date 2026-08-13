import { Sun, Moon } from 'lucide-react'
import { useState } from 'react'

function getInitialTheme() {
  return localStorage.getItem('theme') === 'light'
}

export default function ThemeToggle() {
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
        isDark ? 'Switch to light theme' : 'Switch to dark theme'
      }
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}