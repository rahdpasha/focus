export const THEME_TOKEN_CSS_VARS = {
  voidBlack: '--void-black',
  spaceBlack: '--space-black',
  voidBg: '--void-bg',
  voidSurface: '--void-surface',
  voidSurfaceHover: '--void-surface-hover',
  voidBorder: '--void-border',
  primary: '--primary',
  primaryGlow: '--primary-glow',
  primaryDim: '--primary-dim',
  primarySoft: '--primary-soft',
  primaryBorder: '--primary-border',
  cyberBlue: '--cyber-blue',
  cyberGlow: '--cyber-glow',
  energy: '--energy',
  energyGlow: '--energy-glow',
  teal: '--teal',
  tealGlow: '--teal-glow',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textMuted: '--text-muted',
  success: '--success',
  danger: '--danger',
  warning: '--warning',
  cardBg: '--card-bg',
  cardBorder: '--card-border',
} as const

export type ThemeTokenName =
  keyof typeof THEME_TOKEN_CSS_VARS

export interface ThemeTokenPack {
  version: 1
  id: string
  name: string
  base: 'dark' | 'light'
  tokens: Partial<
    Record<ThemeTokenName, string>
  >
}

const tokenNames =
  new Set<ThemeTokenName>(
    Object.keys(
      THEME_TOKEN_CSS_VARS,
    ) as ThemeTokenName[],
  )

function safeColor(
  value: string,
): boolean {
  const trimmed = value.trim()

  if (
    /^#[0-9a-f]{3,4}$/i.test(
      trimmed,
    ) ||
    /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(
      trimmed,
    )
  ) {
    return true
  }

  const match =
    trimmed.match(
      /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i,
    )

  if (!match) return false

  const channels =
    match
      .slice(1, 4)
      .map(Number)

  if (
    channels.some(
      (channel) =>
        channel < 0 ||
        channel > 255,
    )
  ) {
    return false
  }

  if (
    match[4] !== undefined
  ) {
    const alpha =
      Number(match[4])

    if (
      !Number.isFinite(alpha) ||
      alpha < 0 ||
      alpha > 1
    ) {
      return false
    }
  }

  return true
}

export function normalizeThemeTokenPack(
  input: unknown,
): ThemeTokenPack | null {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input)
  ) {
    return null
  }

  const value =
    input as Record<string, unknown>

  if (
    value.version !== 1 ||
    typeof value.id !== 'string' ||
    !/^[a-z0-9][a-z0-9-_]{0,39}$/.test(
      value.id,
    ) ||
    typeof value.name !== 'string' ||
    value.name.trim().length < 1 ||
    value.name.trim().length > 40 ||
    (value.base !== 'dark' &&
      value.base !== 'light') ||
    !value.tokens ||
    typeof value.tokens !== 'object' ||
    Array.isArray(value.tokens)
  ) {
    return null
  }

  const normalizedTokens:
    Partial<
      Record<ThemeTokenName, string>
    > = {}

  for (
    const [key, tokenValue] of
      Object.entries(
        value.tokens as Record<
          string,
          unknown
        >,
      )
  ) {
    if (
      !tokenNames.has(
        key as ThemeTokenName,
      ) ||
      typeof tokenValue !==
        'string' ||
      !safeColor(tokenValue)
    ) {
      return null
    }

    normalizedTokens[
      key as ThemeTokenName
    ] = tokenValue.trim()
  }

  if (
    Object.keys(
      normalizedTokens,
    ).length === 0
  ) {
    return null
  }

  return {
    version: 1,
    id: value.id,
    name: value.name.trim(),
    base: value.base,
    tokens:
      normalizedTokens,
  }
}

export const MONOCHROME_THEME_PACKS = {
  black: {
    version: 1,
    id: 'black',
    name: 'Black',
    base: 'dark',
    tokens: {
      voidBlack: '#000000',
      spaceBlack: '#000000',
      voidBg: '#000000',
      voidSurface: '#080808',
      voidSurfaceHover: '#111111',
      voidBorder:
        'rgba(255, 255, 255, 0.16)',
      primary: '#ffffff',
      primaryGlow: '#ffffff',
      primaryDim: '#bdbdbd',
      primarySoft:
        'rgba(255, 255, 255, 0.08)',
      primaryBorder:
        'rgba(255, 255, 255, 0.28)',
      cyberBlue: '#d9d9d9',
      cyberGlow: '#ffffff',
      energy: '#f2f2f2',
      energyGlow: '#ffffff',
      teal: '#c8c8c8',
      tealGlow: '#ffffff',
      textPrimary: '#ffffff',
      textSecondary: '#d0d0d0',
      textMuted: '#8c8c8c',
      success: '#ffffff',
      danger: '#d7d7d7',
      warning: '#ececec',
      cardBg: '#080808',
      cardBorder:
        'rgba(255, 255, 255, 0.14)',
    },
  },
  white: {
    version: 1,
    id: 'white',
    name: 'White',
    base: 'light',
    tokens: {
      voidBlack: '#ffffff',
      spaceBlack: '#ffffff',
      voidBg: '#ffffff',
      voidSurface: '#ffffff',
      voidSurfaceHover: '#f4f4f4',
      voidBorder:
        'rgba(0, 0, 0, 0.15)',
      primary: '#000000',
      primaryGlow: '#000000',
      primaryDim: '#444444',
      primarySoft:
        'rgba(0, 0, 0, 0.055)',
      primaryBorder:
        'rgba(0, 0, 0, 0.26)',
      cyberBlue: '#222222',
      cyberGlow: '#000000',
      energy: '#333333',
      energyGlow: '#000000',
      teal: '#555555',
      tealGlow: '#111111',
      textPrimary: '#000000',
      textSecondary: '#333333',
      textMuted: '#707070',
      success: '#000000',
      danger: '#333333',
      warning: '#222222',
      cardBg: '#ffffff',
      cardBorder:
        'rgba(0, 0, 0, 0.14)',
    },
  },
} satisfies Record<
  'black' | 'white',
  ThemeTokenPack
>

export function clearThemeTokens(
  root: HTMLElement,
): void {
  for (
    const cssVariable of
      Object.values(
        THEME_TOKEN_CSS_VARS,
      )
  ) {
    root.style.removeProperty(
      cssVariable,
    )
  }
}

export function applyThemeTokenPack(
  root: HTMLElement,
  pack: ThemeTokenPack,
): void {
  clearThemeTokens(root)

  for (
    const [name, value] of
      Object.entries(pack.tokens)
  ) {
    if (!value) continue

    root.style.setProperty(
      THEME_TOKEN_CSS_VARS[
        name as ThemeTokenName
      ],
      value,
    )
  }
}
