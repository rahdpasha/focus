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
  assert.match(readFileSync('public/sw.js','utf8'), /focus-pwa-v16-reliable-home-updates/)
})

test('iPhone pages remain document-scrollable and end above the bottom nav', () => {
  assert.match(css, /Mobile Safari \/ installed PWA: the document is the single vertical scroller/)
  assert.match(css, /\.calm-content\s*\{[^}]*padding-bottom:\s*calc\(170px\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\)\s*!important/s)
  assert.match(css, /\.calm-app\s*\{[^}]*min-height:\s*100svh;[^}]*overflow:\s*visible;/s)
  assert.match(css, /\.calm-nav\s*\{[^}]*bottom:\s*0;[^}]*padding-bottom:\s*calc\(10px\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\);/s)
  assert.match(css, /max-height:\s*520px/)
})

test('FOCUS phone timer presents all four duration choices in one compact row', () => {
  assert.match(css, /Phone-first FOCUS:/)
  assert.ok(css.includes('.calm-app .duration-v5-presets > button:nth-child(n + 4)'))
  assert.match(css, /grid-column:\s*auto/)
  assert.match(css, /width:\s*min\(230px, 64vw\)/)
})

test('MUSE phone interface keeps the real actions ahead of decorative copy', () => {
  const museCss = readFileSync('src/muse/muse.css', 'utf8')
  assert.match(museCss, /MUSE on phones:/)
  assert.match(museCss, /\.calm-app \.muse \.muse-header\s*\{\s*display:\s*none/)
  assert.match(museCss, /\.calm-app \.muse \.hero-cta\s*\{/)
  assert.match(museCss, /\.calm-app \.muse \.muse-tabs\s*\{/)
  assert.ok(museCss.includes('max-height: calc(100dvh - 28px)'))
})

test('iPhone header offset and MUSE settings safe-area rules stay in sync', () => {
  const museCss = readFileSync('src/muse/muse.css', 'utf8')
  const musePage = readFileSync('src/muse/MusePage.tsx', 'utf8')
  assert.ok(css.includes('padding-top: calc(10px + env(safe-area-inset-top, 0px));'))
  assert.ok(css.includes('padding-top: calc(76px + env(safe-area-inset-top, 0px)) !important;'))
  assert.ok(museCss.includes('--muse-modal-top: max(68px, calc(env(safe-area-inset-top, 0px) + 12px));'))
  assert.ok(museCss.includes('max-height: calc(100dvh - var(--muse-modal-top) - var(--muse-modal-bottom));'))
  assert.ok(musePage.includes('dialog.scrollTop = 0;'))
})

test('MUSE displays Kurdistan rather than Baghdad in time and reminder labels', () => {
  const musePage = readFileSync('src/muse/MusePage.tsx', 'utf8')
  const routines = readFileSync('src/muse/Routines.tsx', 'utf8')
  assert.ok(musePage.includes('t("Kurdistan time", "کاتی کوردستان")'))
  assert.ok(routines.includes('Kurdistan time · Reminders appear while Muse is open.'))
  assert.doesNotMatch(musePage, /"Reminder time in Baghdad"|"Time zone: Asia\/Baghdad|کاتی بەغدا|کاتی بەغدان/)
  assert.doesNotMatch(routines, /Baghdad time|کاتی بەغدا/)
  // Keep the correct IANA identifier for reliable UTC+3 wall-clock reminders.
  assert.ok(musePage.includes('timeZone: "Asia/Baghdad"'))
})

test('the Home Screen update check compares live bundles and never force-reloads', () => {
  const source = readFileSync('src/components/system/PwaUpdateNotice.tsx', 'utf8')
  const main = readFileSync('src/main.tsx', 'utf8')
  assert.ok(main.includes('<PwaUpdateNotice />'), 'PWA updates are checked even on signed-out screens')
  assert.ok(source.includes("document.addEventListener('visibilitychange', onVisibility)"))
  assert.ok(source.includes("window.addEventListener('online', onResume)"))
  assert.ok(source.includes("fetch('/index.html', { cache: 'no-store' })"))
  assert.ok(source.includes("navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })"))
  assert.ok(source.includes('new URL(remote, location.href).pathname !== new URL(local, location.href).pathname'))
  assert.ok(source.includes('onClick={() => window.location.reload()}'))
  assert.ok(!source.includes("if (updateAvailable) window.location.reload()"), 'Never interrupt a live timer')
})
