// Browser-driven checks for the redesigned four-tab FOCUS shell.
// Run in CI with isolated local-only data; never use production credentials.
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
const tabs = ['Focus', 'Progress', 'League', 'Settings']
const errors = []
let screenshots = 0

try {
  for (const device of devices) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: 1,
      hasTouch: true,
      isMobile: true,
      reducedMotion: 'reduce',
      colorScheme: device.dark ? 'dark' : 'light',
    })
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(device.name + ': ' + error.message))
    if (device.dark) {
      await page.addInitScript(() => {
        localStorage.setItem('focus-theme', 'dark')
        localStorage.setItem('focus-settings', JSON.stringify({ theme: 'dark', language: 'en' }))
      })
    }

    await page.goto(base, { waitUntil: 'networkidle' })
    const dock = page.locator('.calm-nav')
    await dock.waitFor({ timeout: 15000 })
    const buttons = dock.locator('button')
    assert.equal(await buttons.count(), 4, 'Redesigned FOCUS must have four mobile tabs')

    for (let i = 0; i < tabs.length; i++) {
      await buttons.nth(i).click()
      // League is lazy-loaded; wait for its stable content.
      if (tabs[i] === 'League') {
        // CI intentionally disables Supabase, so League shows its signed-out
        // entry screen. Authenticated standings were tested on a real device.
        await page.locator('.league-v4-signed-out, .league-v4-grid').first().waitFor()
        const signedOut = await page.locator('.league-v4-signed-out').count()
        assert.equal(signedOut, 1, 'Local-only browser audit should not sign in to League')
      }
      await page.waitForTimeout(220)

      const snapshot = await page.evaluate(() => {
        const documentRoot = document.scrollingElement
        const dockElement = document.querySelector('.calm-nav')
        const content = document.querySelector('main.calm-content')
        const children = content
          ? [...content.children].filter((element) => getComputedStyle(element).display !== 'none')
          : []
        const last = children.at(-1)
        return {
          width: window.innerWidth,
          docWidth: documentRoot?.scrollWidth ?? 0,
          bodyWidth: document.body.scrollWidth,
          dockPosition: dockElement ? getComputedStyle(dockElement).position : '',
          contentExists: Boolean(last),
        }
      })
      assert.ok(snapshot.contentExists, 'Page content missing on ' + device.name + '/' + tabs[i])
      assert.equal(snapshot.dockPosition, 'fixed', 'Bottom navigation should remain fixed')
      assert.ok(
        snapshot.docWidth <= snapshot.width + 4 && snapshot.bodyWidth <= snapshot.width + 4,
        'Unexpected horizontal page overflow on ' + device.name + '/' + tabs[i] + ': ' + JSON.stringify(snapshot),
      )

      // This is the important regression: settled at the *real* bottom,
      // the final card must remain entirely above the fixed navigation,
      // without requiring iOS rubber-band stretching.
      const end = await page.evaluate(async () => {
        const root = document.scrollingElement
        root.scrollTop = root.scrollHeight
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const content = document.querySelector('main.calm-content')
        const visibleChildren = [...content.children].filter((element) => getComputedStyle(element).display !== 'none')
        const last = visibleChildren.at(-1)
        const dock = document.querySelector('.calm-nav')
        const rect = last.getBoundingClientRect()
        return {
          lastBottom: rect.bottom,
          dockTop: dock.getBoundingClientRect().top,
          scrollTop: root.scrollTop,
          maxScroll: root.scrollHeight - root.clientHeight,
        }
      })
      assert.ok(
        end.lastBottom <= end.dockTop - 8,
        'Last page section remains under dock after scroll stops on ' +
          device.name + '/' + tabs[i] + ': ' + JSON.stringify(end),
      )
      assert.ok(
        Math.abs(end.scrollTop - end.maxScroll) < 4,
        'Did not reach normal document scroll endpoint on ' + device.name + '/' + tabs[i] + ': ' + JSON.stringify(end),
      )
      console.log('PASS', device.name, tabs[i], JSON.stringify(end))

      if (device.name === 'iphone' || (device.name === 'small' && tabs[i] === 'League')) {
        await page.screenshot({
          path: 'mobile-qa-artifacts/' + device.name + '-' + tabs[i].toLowerCase() + '.png',
          fullPage: true,
          animations: 'disabled',
        })
        screenshots++
      }
    }

    if (device.name === 'iphone') {
      await buttons.nth(3).click()
      await page.locator('.calm-manage').click()
      const dialog = page.locator('dialog.calm-modal')
      await dialog.waitFor({ state: 'visible' })
      const visible = await dialog.evaluate((el) => {
        const rect = el.getBoundingClientRect()
        return rect.top >= 0 && rect.bottom <= window.innerHeight + 2 &&
          getComputedStyle(el).overflowY !== 'hidden'
      })
      assert.ok(visible, 'Plan dialog must fit and scroll on iPhone')
      await page.keyboard.press('Escape')
    }
    await context.close()
  }
} finally {
  await browser.close()
}
assert.deepEqual(errors, [], 'Browser errors: ' + errors.join('; '))
console.log('Mobile audit PASSED; screenshots captured:', screenshots)
