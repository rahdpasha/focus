import type { ThemeTokenPack } from './themeTokens.ts'

export interface Palette { background: string; surface: string; primary: string; secondary: string; text: string }
export const PRESETS: Record<string, Palette> = {
  Ocean: { background: '#0c1426', surface: '#162238', primary: '#8ab8fa', secondary: '#70c9c1', text: '#eef3ff' },
  Forest: { background: '#101e1a', surface: '#1b2c25', primary: '#a6d5af', secondary: '#d2bd8c', text: '#edf5eb' },
  Aurora: { background: '#171429', surface: '#25213b', primary: '#b9acf5', secondary: '#7dd5c6', text: '#f3efff' },
  Sunset: { background: '#fcf5ef', surface: '#fffaf7', primary: '#984c35', secondary: '#855274', text: '#392c30' },
  Graphite: { background: '#191b20', surface: '#25282f', primary: '#bdc9dd', secondary: '#a6bdb8', text: '#f0f1f4' },
}
export function hex(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  if (/^#[\da-f]{6}$/i.test(value)) return value.toLowerCase()
  if (/^#[\da-f]{3}$/i.test(value)) return '#' + [...value.slice(1)].map(c => c + c).join('')
  const rgb = value.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)
  return rgb ? '#' + rgb.slice(1).map(c => Number(c).toString(16).padStart(2, '0')).join('') : fallback
}
function channels(color: string) { return [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16)) }
export function luminance(color: string) {
  return channels(color).map(c => { const v = c / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }).reduce((s, c, i) => s + c * [.2126, .7152, .0722][i], 0)
}
export function contrast(a: string, b: string) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) }
export function mix(a: string, b: string, ratio: number) { const bc = channels(b); return '#' + channels(a).map((c, i) => Math.round(c * (1 - ratio) + bc[i] * ratio).toString(16).padStart(2, '0')).join('') }
export function readable(color: string, backgrounds: string[]) {
  if (backgrounds.every(bg => contrast(color, bg) >= 4.5)) return color
  const target = ['#ffffff', '#000000'].sort((a, b) => Math.min(...backgrounds.map(bg => contrast(b, bg))) - Math.min(...backgrounds.map(bg => contrast(a, bg))))[0]
  for (let i = 1; i <= 100; i++) { const candidate = mix(color, target, i / 100); if (backgrounds.every(bg => contrast(candidate, bg) >= 4.5)) return candidate }
  return target
}
export function safePalette(input: Palette): Palette {
  const p = Object.fromEntries(Object.entries(input).map(([k, v]) => [k, hex(v, PRESETS.Ocean[k as keyof Palette])])) as unknown as Palette
  // Opposing light/dark surfaces can make one shared text color impossible.
  if (!['#ffffff', '#000000'].some(c => [p.background, p.surface].every(bg => contrast(c, bg) >= 4.5))) p.surface = mix(p.background, p.text, .06)
  const surfaces = [p.background, p.surface]
  return { ...p, text: readable(p.text, surfaces), primary: readable(p.primary, surfaces), secondary: readable(p.secondary, surfaces) }
}
export function paletteFromPack(pack: ThemeTokenPack | null): Palette {
  const fallback = pack?.base === 'light' ? PRESETS.Sunset : PRESETS.Ocean
  const t = pack?.tokens
  return safePalette({ background: hex(t?.voidBg, fallback.background), surface: hex(t?.cardBg ?? t?.voidSurface, fallback.surface), primary: hex(t?.primary, fallback.primary), secondary: hex(t?.cyberBlue, fallback.secondary), text: hex(t?.textPrimary, fallback.text) })
}
export function createThemePack(input: Palette, name = 'Custom'): ThemeTokenPack {
  const p = safePalette(input), surfaces = [p.background, p.surface]
  const soft = mix(p.surface, p.primary, .08), border = mix(p.surface, p.text, .2)
  return { version: 1, id: 'custom', name, base: luminance(p.background) < .18 ? 'dark' : 'light', tokens: {
    voidBlack: p.background, spaceBlack: p.surface, voidBg: p.background, voidSurface: p.surface, voidSurfaceHover: mix(p.surface, p.text, .06), voidBorder: border,
    primary: p.primary, primaryGlow: p.primary, primaryDim: p.primary, primarySoft: soft, primaryBorder: mix(p.surface, p.primary, .35),
    cyberBlue: p.secondary, cyberGlow: p.secondary, energy: p.secondary, energyGlow: p.secondary, teal: p.secondary, tealGlow: p.secondary,
    textPrimary: p.text, textSecondary: readable(mix(p.text, p.surface, .2), [...surfaces, soft]), textMuted: readable(mix(p.text, p.surface, .35), [...surfaces, soft]),
    success: readable('#529c79', surfaces), danger: readable('#dc706e', surfaces), warning: readable('#c99b55', surfaces), cardBg: p.surface, cardBorder: border,
  } }
}
export const BUILTIN_PACKS = {
  green: {
    ...createThemePack({
      background: '#f7f8f4', surface: '#ffffff',
      primary: '#24766a', secondary: '#397b89', text: '#203b34',
    }, 'Original Green'),
    id: 'original-green',
    tokens: {
      ...createThemePack({
        background: '#f7f8f4', surface: '#ffffff',
        primary: '#24766a', secondary: '#397b89', text: '#203b34',
      }).tokens,
      voidBlack: '#f7f8f4', spaceBlack: '#eef1eb',
      voidBg: '#f7f8f4', voidSurface: '#ffffff',
      voidSurfaceHover: '#f4f6f1', voidBorder: '#e1e7df',
      primary: '#24766a', primarySoft: '#e6f1eb',
      primaryBorder: '#bdd8cc', textPrimary: '#203b34',
      cardBg: '#ffffff', cardBorder: '#e1e7df',
    },
  },
  dark: { ...createThemePack(PRESETS.Ocean, 'Midnight'), id: 'midnight' },
  light: { ...createThemePack({ background: '#f8f6f1', surface: '#fffefa', primary: '#39695f', secondary: '#886849', text: '#292f32' }, 'Soft Light'), id: 'soft-light' },
}
