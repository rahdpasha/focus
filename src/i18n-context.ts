import { createContext } from 'react'
import type {
  Language,
  TranslationKey,
} from './translations'

export interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

export const I18nContext =
  createContext<I18nContextValue | null>(null)