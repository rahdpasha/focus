import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MONOCHROME_THEME_PACKS,
  normalizeThemeTokenPack,
} from '../src/app/themeTokens.ts'

test('built-in monochrome packs pass token validation', () => {
  assert.deepEqual(
    normalizeThemeTokenPack(
      MONOCHROME_THEME_PACKS.black,
    ),
    MONOCHROME_THEME_PACKS.black,
  )
  assert.deepEqual(
    normalizeThemeTokenPack(
      MONOCHROME_THEME_PACKS.white,
    ),
    MONOCHROME_THEME_PACKS.white,
  )
})

test('theme pack validation rejects arbitrary CSS injection values', () => {
  assert.equal(
    normalizeThemeTokenPack({
      version: 1,
      id: 'unsafe',
      name: 'Unsafe',
      base: 'dark',
      tokens: {
        voidBg:
          'url(https://example.com/x)',
      },
    }),
    null,
  )

  assert.equal(
    normalizeThemeTokenPack({
      version: 1,
      id: 'unsafe-var',
      name: 'Unsafe var',
      base: 'dark',
      tokens: {
        primary:
          'var(--anything)',
      },
    }),
    null,
  )
})

test('theme pack validation rejects unknown token names', () => {
  assert.equal(
    normalizeThemeTokenPack({
      version: 1,
      id: 'unknown',
      name: 'Unknown',
      base: 'light',
      tokens: {
        backgroundImage:
          '#ffffff',
      },
    }),
    null,
  )
})

test('theme pack validation accepts a constrained custom color preset', () => {
  const normalized =
    normalizeThemeTokenPack({
      version: 1,
      id: 'paper-gray',
      name: 'Paper Gray',
      base: 'light',
      tokens: {
        voidBg: '#f8f8f8',
        textPrimary:
          'rgb(20, 20, 20)',
        voidBorder:
          'rgba(0, 0, 0, 0.12)',
      },
    })

  assert.equal(
    normalized?.id,
    'paper-gray',
  )
  assert.equal(
    normalized?.tokens.voidBg,
    '#f8f8f8',
  )
})
