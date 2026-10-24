import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const shell = readFileSync('src/components/layout/AppShell.tsx','utf8')
const css = readFileSync('src/calm.css','utf8')
test('primary navigation has exactly four destinations including Settings', () => {
  assert.deepEqual([...shell.matchAll(/page: '(\w+)' as const/g)].map(m => m[1]), ['focus','progress','league','settings'])
})
test('mobile layout reserves safe area and keyboard access', () => {
  assert.match(css, /env\(safe-area-inset-bottom\)/)
  assert.match(css, /repeat\(4,minmax\(0,1fr\)\)/)
  assert.match(css, /:has\(input:focus,textarea:focus,select:focus\)/)
})
test('PWA refreshes the redesigned assets', () => {
  assert.match(readFileSync('public/sw.js','utf8'), /focus-pwa-v10-advisor-access/)
})

test('iPhone pages remain document-scrollable and end above the bottom nav', () => {
  assert.match(css, /Mobile Safari \/ installed PWA: the document is the single vertical scroller/)
  assert.match(css, /\.calm-content\s*\{[^}]*padding-bottom:\s*calc\(170px\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\)\s*!important/s)
  assert.match(css, /\.calm-app\s*\{[^}]*min-height:\s*100svh;[^}]*overflow:\s*visible;/s)
  assert.match(css, /\.calm-nav\s*\{[^}]*bottom:\s*0;[^}]*padding-bottom:\s*calc\(10px\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\);/s)
  assert.match(css, /max-height:\s*520px/)
})
