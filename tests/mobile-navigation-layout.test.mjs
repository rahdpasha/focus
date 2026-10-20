import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const mobileDock = readFileSync('src/components/layout/MobileDock.tsx', 'utf8')
const css = readFileSync('src/index.css', 'utf8')
const serviceWorker = readFileSync('public/sw.js', 'utf8')

test('mobile navigation includes direct Settings access', () => {
  for (const page of ['dashboard', 'focus', 'plan', 'progress', 'league', 'settings']) {
    assert.match(mobileDock, new RegExp(`page: '${page}' as const`))
  }
  assert.match(css, /grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)/)
})

test('mobile Focus content clears the fixed dock and safe area', () => {
  assert.match(css, /\.app-content\s*>\s*main\.page-container\s*\{[\s\S]*?padding:\s*72px 16px calc\(136px \+ env\(safe-area-inset-bottom\)\) !important/)
  assert.match(css, /\.focus-timer-stage\s*\{[\s\S]*?min-height:\s*0/)
  assert.match(css, /\.focus-timer-wrap\s*\{[\s\S]*?min-height:\s*0/)
  assert.match(css, /\.timer-v5-actions\s*>\s*button\s*\{[\s\S]*?min-height:\s*48px/)
})

test('service worker version changes to refresh installed mobile styles', () => {
  assert.match(serviceWorker, /CACHE_NAME = 'focus-pwa-v5'/)
})
