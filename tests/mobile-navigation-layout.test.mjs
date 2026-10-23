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
  assert.match(readFileSync('public/sw.js','utf8'), /focus-pwa-v8-calm/)
})
