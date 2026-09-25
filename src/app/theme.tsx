/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyThemeTokenPack,
  clearThemeTokens,
  MONOCHROME_THEME_PACKS,
} from './themeTokens'

export type ThemeMode = 'dark' | 'light' | 'system' | 'black' | 'white'

type ThemeContextValue = {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

const THEME_KEY = 'focus-theme'
export const ThemeContext = createContext<ThemeContextValue | null>(null)

function loadTheme(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' || value === 'system' || value === 'black' || value === 'white'
      ? value
      : 'system'
  } catch {
    return 'system'
  }
}

function resolveTheme(theme: ThemeMode): ThemeMode {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

function resolveColorScheme(theme: ThemeMode): 'dark' | 'light' {
  const resolved = resolveTheme(theme)
  return resolved === 'light' || resolved === 'white'
    ? 'light'
    : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(loadTheme)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')

    const apply = () => {
      const resolved =
        resolveTheme(theme)
      const root =
        document.documentElement

      root.setAttribute(
        'data-theme',
        resolved,
      )
      root.style.colorScheme =
        resolveColorScheme(theme)

      if (
        resolved === 'black' ||
        resolved === 'white'
      ) {
        applyThemeTokenPack(
          root,
          MONOCHROME_THEME_PACKS[
            resolved
          ],
        )
      } else {
        clearThemeTokens(root)
      }
    }

    apply()

    if (theme === 'system') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
  }, [theme])

  const setTheme = (nextTheme: ThemeMode) => {
    setThemeState(nextTheme)
    try {
      localStorage.setItem(THEME_KEY, nextTheme)
    } catch {
      // Ignore storage errors.
    }
  }

  const value = useMemo(() => ({ theme, setTheme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

