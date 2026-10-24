import test from 'node:test'
import assert from 'node:assert/strict'
import { PRESETS, BUILTIN_PACKS, safePalette, createThemePack, paletteFromPack, contrast } from '../src/app/appearance.ts'
import { normalizeThemeTokenPack } from '../src/app/themeTokens.ts'
import { normalizeSettings } from '../src/app/settings.ts'
import { serializeCloudAppearance, deserializeCloudAppearance } from '../src/app/themePersistence.ts'

test('presets and adversarial colors remain readable across both surfaces', () => {
  const palettes = [...Object.values(PRESETS), { background: '#ffffff', surface: '#000000', primary: '#ffffff', secondary: '#000000', text: '#777777' }, { background: '#777777', surface: '#888888', primary: '#777777', secondary: '#888888', text: '#777777' }]
  for (const palette of palettes) {
    const safe = safePalette(palette)
    for (const token of ['text', 'primary', 'secondary']) for (const bg of ['background', 'surface']) assert.ok(contrast(safe[token], safe[bg]) >= 4.5, `${token} on ${bg}`)
    const pack = createThemePack(palette)
    assert.ok(normalizeThemeTokenPack(pack))
    for (const token of ['textSecondary', 'textMuted']) for (const bg of ['voidBg', 'cardBg', 'primarySoft']) assert.ok(contrast(pack.tokens[token], pack.tokens[bg]) >= 4.5, `${token} on ${bg}`)
  }
})
test('custom packs round-trip through file JSON and existing settings normalization', () => {
  for (const [name, palette] of Object.entries(PRESETS)) {
    const pack = createThemePack(palette, name)
    const restored = normalizeSettings(JSON.parse(JSON.stringify({ theme: 'custom', customThemePack: pack })))
    assert.equal(restored.theme, 'custom')
    assert.deepEqual(restored.customThemePack, pack)
    assert.deepEqual(paletteFromPack(pack), safePalette(palette))
  }
})
test('partial legacy packs get complete safe palettes without losing their stored schema', () => {
  const pack = normalizeThemeTokenPack({ version: 1, id: 'old', name: 'Old', base: 'light', tokens: { textPrimary: 'rgb(20, 20, 20)', voidBg: '#fff' } })
  assert.ok(pack)
  assert.equal(paletteFromPack(pack).background, '#ffffff')
  assert.equal(createThemePack(paletteFromPack(pack)).base, 'light')
})
test('Original Green stays separate from Soft Light and Midnight', () => {
  assert.equal(BUILTIN_PACKS.green.tokens.voidBg, '#f7f8f4')
  assert.equal(BUILTIN_PACKS.green.tokens.primary, '#24766a')
  assert.notEqual(BUILTIN_PACKS.green.tokens.voidBg, BUILTIN_PACKS.light.tokens.voidBg)
  assert.equal(normalizeSettings({ theme: 'green' }).theme, 'green')
})
test('Original Green cloud encoding uses the existing schema and preserves custom palettes', () => {
  for (const customThemePack of [null, createThemePack(PRESETS.Aurora)]) {
    const cloud = serializeCloudAppearance({ theme: 'green', customThemePack })
    assert.equal(cloud.theme, 'light')
    assert.ok(normalizeThemeTokenPack(cloud.customThemePack))
    const restored = deserializeCloudAppearance(cloud.theme, JSON.parse(JSON.stringify(cloud.customThemePack)))
    assert.equal(restored.theme, 'green')
    assert.deepEqual(restored.customThemePack, customThemePack)
    const normal = serializeCloudAppearance({ theme: 'dark', customThemePack })
    assert.equal(normal.theme, 'dark')
    assert.deepEqual(normal.customThemePack, customThemePack)
  }
})
test('Midnight is navy and differs from OLED black; soft light is warm', () => {
  assert.equal(BUILTIN_PACKS.dark.tokens.voidBg, '#0c1426')
  assert.equal(BUILTIN_PACKS.light.tokens.voidBg, '#f8f6f1')
})
