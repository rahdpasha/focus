import type { ThemeMode } from './theme'
import type { Language } from '../translations'

export interface AppSettings {
  theme: ThemeMode
  language: Language
  shortBreak: number
  longBreak: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  soundEnabled: boolean
  soundVolume: number
  notificationsEnabled: boolean
}

export const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreak: false,
  soundEnabled: true,
  soundVolume: 70,
  notificationsEnabled: true,
}

export const settingRanges = {
  shortBreak: { min: 1, max: 60 },
  longBreak: { min: 1, max: 120 },
  sessionsBeforeLongBreak: { min: 1, max: 10 },
  soundVolume: { min: 0, max: 100 },
} as const

export function normalizeSettings(input: Partial<AppSettings> | null | undefined): AppSettings {
  const source = input ?? {}
  return {
    theme:
      source.theme === 'dark' ||
      source.theme === 'light' ||
      source.theme === 'system'
        ? source.theme
        : defaultSettings.theme,
    language:
      source.language === 'ku'
        ? 'ku'
        : 'en',
    shortBreak: clampNumber(source.shortBreak, settingRanges.shortBreak, defaultSettings.shortBreak),
    longBreak: clampNumber(source.longBreak, settingRanges.longBreak, defaultSettings.longBreak),
    sessionsBeforeLongBreak: clampNumber(source.sessionsBeforeLongBreak, settingRanges.sessionsBeforeLongBreak, defaultSettings.sessionsBeforeLongBreak),
    autoStartBreak: typeof source.autoStartBreak === 'boolean' ? source.autoStartBreak : defaultSettings.autoStartBreak,
    soundEnabled: typeof source.soundEnabled === 'boolean' ? source.soundEnabled : defaultSettings.soundEnabled,
    soundVolume: clampNumber(source.soundVolume, settingRanges.soundVolume, defaultSettings.soundVolume),
    notificationsEnabled: typeof source.notificationsEnabled === 'boolean' ? source.notificationsEnabled : defaultSettings.notificationsEnabled,
  }
}

function clampNumber(value: unknown, range: { min: number; max: number }, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(range.max, Math.max(range.min, value))
}
