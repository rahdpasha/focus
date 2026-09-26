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
  normalizeThemeTokenPack,
  type ThemeTokenPack,
} from './themeTokens'

export type ThemeMode = 'dark' | 'light' | 'system' | 'black' | 'white' | 'custom'

type ThemeContextValue = {
  theme: ThemeMode
  customThemePack: ThemeTokenPack | null
  setTheme: (theme: ThemeMode) => void
  setCustomThemePack: (pack: ThemeTokenPack | null) => void
}

const THEME_KEY = 'focus-theme'
const THEME_PACK_KEY = 'focus-theme-pack'
export const ThemeContext = createContext<ThemeContextValue | null>(null)

function loadTheme(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' || value === 'system' || value === 'black' || value === 'white' || value === 'custom'
      ? value
      : 'system'
  } catch {
    return 'system'
  }
}


function loadThemePack(): ThemeTokenPack | null {
  try {
    const raw = localStorage.getItem(THEME_PACK_KEY)
    if (!raw) return null
    return normalizeThemeTokenPack(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

function resolveTheme(theme: ThemeMode): ThemeMode {
  if (theme !== 'system' && theme !== 'custom') return theme
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
  const [customThemePack, setCustomThemePackState] = useState<ThemeTokenPack | null>(loadThemePack)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')

    const apply = () => {
      const root = document.documentElement

      if (
        theme === 'custom' &&
        customThemePack
      ) {
        root.setAttribute(
          'data-theme',
          customThemePack.base,
        )
        root.style.colorScheme =
          customThemePack.base
        applyThemeTokenPack(
          root,
          customThemePack,
        )
        return
      }

      const resolved =
        resolveTheme(theme)

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
  }, [theme, customThemePack])

  const setCustomThemePack = (
    pack: ThemeTokenPack | null,
  ) => {
    const normalized =
      pack
        ? normalizeThemeTokenPack(pack)
        : null

    setCustomThemePackState(normalized)

    try {
      if (normalized) {
        localStorage.setItem(
          THEME_PACK_KEY,
          JSON.stringify(normalized),
        )
      } else {
        localStorage.removeItem(THEME_PACK_KEY)
      }
    } catch {
      // Ignore storage errors.
    }
  }

  const setTheme = (nextTheme: ThemeMode) => {
    setThemeState(nextTheme)
    try {
      localStorage.setItem(THEME_KEY, nextTheme)
    } catch {
      // Ignore storage errors.
    }
  }

  const value = useMemo(
    () => ({
      theme,
      customThemePack,
      setTheme,
      setCustomThemePack,
    }),
    [theme, customThemePack],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

