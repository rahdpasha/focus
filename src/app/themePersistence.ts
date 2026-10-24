import type { AppSettings } from './settings.ts'
import type { ThemeMode } from './theme'
import {
  normalizeThemeTokenPack,
  type ThemeTokenPack,
} from './themeTokens.ts'
import { BUILTIN_PACKS } from './appearance.ts'

type SavedAppearance = Pick<AppSettings, 'theme' | 'customThemePack'>
type MarkerPack = ThemeTokenPack & {
  focusAppearance?: 'original-green'
  focusMarkerOnly?: boolean
}

/**
 * Existing cloud rows allow six theme names, so Original Green is stored as
 * a valid light value plus metadata on the existing JSONB theme pack.
 * The saved custom palette remains intact, and no live DB migration is needed.
 */
export function serializeCloudAppearance(settings: SavedAppearance) {
  if (settings.theme !== 'green') {
    return {
      theme: settings.theme,
      customThemePack: settings.customThemePack,
    }
  }

  const markerOnly = settings.customThemePack === null
  const original = settings.customThemePack ?? BUILTIN_PACKS.green

  return {
    theme: 'light' as const,
    customThemePack: {
      ...original,
      focusAppearance: 'original-green' as const,
      focusMarkerOnly: markerOnly,
    } satisfies MarkerPack,
  }
}

export function deserializeCloudAppearance(theme: ThemeMode, rawPack: unknown): SavedAppearance {
  const pack = normalizeThemeTokenPack(rawPack)
  const metadata =
    rawPack && typeof rawPack === 'object' && !Array.isArray(rawPack)
      ? rawPack as Record<string, unknown>
      : null

  if (theme === 'light' && pack && metadata?.focusAppearance === 'original-green') {
    return {
      theme: 'green',
      customThemePack: metadata.focusMarkerOnly === true ? null : pack,
    }
  }

  return { theme, customThemePack: pack }
}
