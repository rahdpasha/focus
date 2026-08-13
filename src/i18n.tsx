import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  translations,
  type Language,
} from './translations'
import { I18nContext } from './i18n-context'

const LANGUAGE_KEY = 'focus-language'

function loadLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === 'ku'
      ? 'ku'
      : 'en'
  } catch {
    return 'en'
  }
}

export function I18nProvider({
  children,
}: {
  children: ReactNode
}) {
  const [language, setLanguageState] =
    useState<Language>(loadLanguage)

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage)
  }

  useEffect(() => {
    try {
      localStorage.setItem(
        LANGUAGE_KEY,
        language
      )
    } catch {
      // Ignore storage errors
    }

    document.documentElement.lang =
      language === 'ku' ? 'ku' : 'en'

    document.documentElement.dir =
      language === 'ku' ? 'rtl' : 'ltr'
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (
        key: keyof typeof translations.en
      ) => translations[language][key],
    }),
    [language]
  )

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}