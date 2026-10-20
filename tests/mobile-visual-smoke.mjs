// Browser-driven mobile audit. Executed in a disposable, local-data-only
// CI preview; no account credentials or production customer data are used.
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const base = 'http://127.0.0.1:4175'
mkdirSync('mobile-qa-artifacts', { recursive: true })

const browser = await chromium.launch({ headless: true })
const devices = [
  { name: 'iphone', width: 390, height: 844 },
  { name: 'iphone-dark', width: 390, height: 844, dark: true },
  { name: 'small', width: 320, height: 700 },
  { name: 'large', width: 430, height: 932 },
  { name: 'landscape', width: 700, height: 390 },
]

const sampleSession = {
  id: 'mobile-qa-session', subjectId: '1', subjectName: 'Software Engineering',
  subjectColor: '#8b5cf6', duration: 1500, actualDuration: 1500,
  startedAt: new Date(Date.now() - 1800000).toISOString(),
  completedAt: new Date().toISOString(), completed: true,
  interruptions: 0, totalPausedSeconds: 0,
}
let count = 0
const errors = []

for (const device of devices) {
  const ctx = await browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    locale: 'en-US',
    reducedMotion: 'reduce',
  })
  const page = await ctx.newPage()
  page.on('pageerror', (error) => errors.push(device.name + ': ' + error.message))

  await page.addInitScript((seed) => {
    try {
      localStorage.setItem('focus-sessions', JSON.stringify([seed.session]))
      if (seed.dark) {
        localStorage.setItem('focus-theme', 'dark')
        localStorage.setItem('focus-settings', JSON.stringify({ theme: 'dark' }))
      }
    } catch { /* Test scaffold only */ }
  }, { session: sampleSession, dark: Boolean(device.dark) })

  await page.goto(base, { waitUntil: 'networkidle' })
  await page.locator('.mobile-dock').waitFor({ timeout: 15000 })

  async function capture(label) {
    await page.waitForTimeout(120)
    const sizes = await page.evaluate(() => ({
      vw: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      docHeight: document.documentElement.scrollHeight,
      dock: Boolean(document.querySelector('.mobile-dock')),
    }))
    assert.ok(sizes.dock, 'Mobile dock missing: ' + label)
    assert.ok(
      sizes.scroll <= sizes.vw + 3 && sizes.body <= sizes.vw + 3,
      'Horizontal document overflow on ' + device.name + '/' + label +
        ': ' + JSON.stringify(sizes),
    )
    await page.screenshot({
      path: 'mobile-qa-artifacts/' + device.name + '-' + label + '.png',
      fullPage: device.name.startsWith('iphone'),
      animations: 'disabled',
    })
    count++
    console.log('PASS', device.name, label, JSON.stringify(sizes))
  }

  const dock = page.locator('.mobile-dock-item')
  assert.equal(await dock.count(), 6, 'Expected Today, Focus, Plan, Progress, League and Settings')
  const navigation = {
    today: 0, focus: 1, plan: 2, progress: 3, league: 4, settings: 5,
  }

  async function openTab(name) {
    await dock.nth(navigation[name]).click()
    await page.waitForTimeout(220)
    await capture(name)
  }

  await capture('today')
  await openTab('focus')

  const start = page.locator('.timer-v5-actions button').first()
  assert.ok(await start.count(), 'Focus timer primary action missing')
  await start.scrollIntoViewIfNeeded()
  // A 390px-high landscape viewport needs a different scroll offset from
  // portrait. Put the button in the available space above the fixed dock.
  await start.evaluate((button) => {
    const rect = button.getBoundingClientRect()
    const dock = document.querySelector('.mobile-dock')?.getBoundingClientRect()
    const visibleBottom = dock?.top ?? window.innerHeight
    const wantedTop = Math.max(12, Math.min(100, visibleBottom - rect.height - 24))
    window.scrollBy(0, rect.top - wantedTop)
  })
  await page.waitForTimeout(90)
  const buttonPosition = await start.evaluate((button) => {
    const rect = button.getBoundingClientRect()
    const dock = document.querySelector('.mobile-dock')?.getBoundingClientRect()
    const visibleBottom = dock?.top ?? window.innerHeight
    return { top: rect.top, bottom: rect.bottom, dockTop: visibleBottom }
  })
  assert.ok(
    buttonPosition.top >= 0 && buttonPosition.bottom < buttonPosition.dockTop - 3,
    'Timer start action is covered by mobile navigation on ' + device.name +
      ': ' + JSON.stringify(buttonPosition),
  )

  await openTab('plan')
  const planTabs = page.locator('.plan-v4-tab')
  assert.equal(await planTabs.count(), 4)
  for (let i = 0; i < 4; i++) {
    await planTabs.nth(i).click()
    await capture('plan-' + ['goals', 'subjects', 'routine', 'advisor'][i])
  }

  await openTab('progress')
  const progressTabs = page.locator('.progress-v4-tab')
  assert.equal(await progressTabs.count(), 3, 'Seeded session should unlock Progress tabs')
  for (let i = 0; i < 3; i++) {
    await progressTabs.nth(i).click()
    await capture('progress-' + ['overview', 'records', 'history'][i])
  }

  await openTab('league')
  await openTab('settings')
  const settingsTabs = page.locator('.settings-v4-tab')
  assert.equal(await settingsTabs.count(), 4)
  for (let i = 0; i < 4; i++) {
    await settingsTabs.nth(i).click()
    await capture('settings-' + ['general', 'focus', 'alerts', 'account'][i])
  }
  await ctx.close()
}

await browser.close()
assert.deepEqual(errors, [], 'Browser runtime exceptions: ' + errors.join('; '))
console.log('Browser mobile audit PASSED. Screens visited: ' + count)
