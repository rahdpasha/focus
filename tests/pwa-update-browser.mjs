// Browser test for an old installed FOCUS page discovering a new Vite build.
// Uses a disposable local-only CI app; no production credentials or data.
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  let pageNavigations = 0
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) pageNavigations += 1
  })
  // Root navigation returns the running app, while a fresh HTML update
  // check advertises a different hashed entry bundle.
  await page.route('**/index.html', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html><head><script type="module" src="/assets/next-version-test.js"></script></head><body></body></html>',
    })
  })
  await page.goto(process.env.FOCUS_TEST_URL || 'http://127.0.0.1:4175', {
    waitUntil: 'networkidle',
  })
  await page.locator('.pwa-update-notice').waitFor({
    state: 'visible', timeout: 15000,
  })
  assert.equal(await page.getByRole('button', { name: 'Refresh app' }).count(), 1)
  assert.match(await page.locator('.pwa-update-notice').innerText(), /new FOCUS version/)
  assert.equal(pageNavigations, 1, 'Update prompt should not interrupt the current session')
  await context.close()
  console.log('PASS installed PWA: newer bundle is detected without forced reload')
} finally {
  await browser.close()
}
