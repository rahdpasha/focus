// Run with Playwright installed, against a local-only instance (Supabase placeholders).
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright' : 'playwright')
const launch = process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'] } : {}
const browser = await chromium.launch({ headless: true, ...launch })
const base = process.env.FOCUS_TEST_URL || 'http://127.0.0.1:4180'
mkdirSync('qa', { recursive: true })
const errors = []
let pageChecks = 0
async function open(width, language = 'en') {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
  await context.route('https://**/*', r => r.abort())
  const page = await context.newPage()
  page.on('pageerror', e => errors.push(e.message))
  await page.addInitScript(({ language }) => { if (!localStorage.getItem('focus-settings')) localStorage.setItem('focus-settings', JSON.stringify({ theme: 'dark', language })) }, { language })
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.locator('.calm-nav').waitFor()
  return { page, context }
}
async function settings(page) { await page.locator('.calm-nav button').nth(3).click() }
async function token(page, name) { return page.evaluate(name => getComputedStyle(document.documentElement).getPropertyValue(name).trim(), name) }
try {
  const { page, context } = await open(1280)
  await settings(page)
  assert.equal(await token(page, '--void-bg'), '#0c1426')
  await page.locator('.theme-option-green').click()
  assert.equal(await token(page, '--void-bg'), '#f7f8f4')
  assert.equal(await token(page, '--primary'), '#24766a')
  await page.screenshot({ path: 'qa/after-original-green.png', fullPage: true, animations: 'disabled' })
  await page.locator('.theme-option-dark').click()
  await page.screenshot({ path: 'qa/after-midnight.png', fullPage: true, animations: 'disabled' })
  await page.locator('.theme-option-custom').click()
  await page.getByRole('button', { name: 'Aurora', exact: true }).click()
  assert.equal(await token(page, '--void-bg'), '#0c1426', 'Draft must not alter applied theme')
  await page.screenshot({ path: 'qa/after-custom.png', fullPage: true, animations: 'disabled' })
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  assert.equal(await page.locator('.theme-editor').count(), 0)
  await page.locator('.theme-option-custom').click()
  await page.getByRole('button', { name: 'Aurora', exact: true }).click()
  await page.getByRole('button', { name: 'Save and apply', exact: true }).click()
  assert.equal(await token(page, '--void-bg'), '#171429')
  await page.reload(); await settings(page)
  assert.equal(await token(page, '--void-bg'), '#171429', 'Custom palette survives reload')
  await page.locator('.theme-option-custom').click()
  await page.getByRole('button', { name: 'Reset to default', exact: true }).click()
  await page.getByRole('button', { name: 'Restore saved', exact: true }).click()
  assert.equal(await page.getByLabel('Background', { exact: true }).inputValue(), '#171429')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export theme', exact: true }).click()
  const download = await downloadEvent
  const themeInput = page.locator('input[type=file][accept="application/json,.json"]')
  const exported = await download.path()
  await page.locator('.theme-option-light').click()
  await themeInput.setInputFiles(exported)
  await page.waitForFunction(() => document.documentElement.dataset.appearance === 'custom')
  assert.equal(await token(page, '--void-bg'), '#171429', 'Import restores exported colors')
  await themeInput.setInputFiles({ name: 'unsafe.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, id: 'bad', name: 'Bad', base: 'dark', tokens: { primary: 'url(https://bad.invalid)' } })) })
  await page.locator('.settings-theme-error').waitFor()
  assert.equal(await token(page, '--void-bg'), '#171429', 'Rejected import must not alter saved theme')
  await page.locator('.appearance-motion button').nth(0).click()
  await page.reload(); await settings(page)
  assert.equal(await page.locator('.living-background').getAttribute('data-motion'), 'off')
  await page.locator('.appearance-motion button').nth(2).click()
  assert.equal(await page.locator('.ambient-haze-one').evaluate(el => getComputedStyle(el).animationName), 'none', 'Reduced motion must override Normal')
  await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'dark' })
  assert.equal(await page.locator('.ambient-haze-one').evaluate(el => getComputedStyle(el).animationName), 'haze-breathe-one')
  assert.equal(await page.locator('.living-background').evaluate(el => getComputedStyle(el).pointerEvents), 'none')
  const star = page.locator('.ambient-star').first()
  const firstPosition = await star.evaluate(el => getComputedStyle(el).transform)
  await page.waitForTimeout(800)
  assert.notEqual(firstPosition, await star.evaluate(el => getComputedStyle(el).transform), 'Particles must visibly drift')
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) })
  await page.waitForFunction(() => document.querySelector('.living-background')?.dataset.paused === 'true')
  assert.equal(await page.locator('.ambient-haze-one').evaluate(el => getComputedStyle(el).animationPlayState), 'paused')
  await page.locator('.theme-option-system').click()
  await page.emulateMedia({ colorScheme: 'light' }); await page.waitForFunction(() => document.documentElement.dataset.theme === 'light')
  assert.equal(await token(page, '--void-bg'), '#f8f6f1')
  await page.emulateMedia({ colorScheme: 'dark' }); await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark')
  assert.equal(await token(page, '--void-bg'), '#0c1426')
  await context.close()
  for (const width of [320, 390, 1280]) {
    const { page, context } = await open(width)
    for (const theme of ['green', 'dark', 'light', 'black', 'white']) {
      await settings(page); await page.locator('.theme-option-' + theme).click()
      if (theme === 'black') assert.equal(await token(page, '--void-bg'), '#000000')
      if (theme === 'white') assert.equal(await token(page, '--void-bg'), '#ffffff')
      for (let tab = 0; tab < 4; tab++) {
        await page.locator('.calm-nav button').nth(tab).click()
        if (tab === 2) await page.locator('.league-v4-signed-out').waitFor()
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}/${theme}/${tab} overflow`)
        if (width < 768) assert.equal(await page.locator('.calm-nav').evaluate(el => getComputedStyle(el).position), 'fixed')
        if (width < 768) {
          const end = await page.evaluate(async () => {
            const root = document.scrollingElement; root.scrollTop = root.scrollHeight
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
            const last = [...document.querySelector('main').children].filter(el => getComputedStyle(el).display !== 'none').at(-1)
            return { bottom: last.getBoundingClientRect().bottom, dock: document.querySelector('.calm-nav').getBoundingClientRect().top }
          })
          assert.ok(end.bottom <= end.dock - 8, 'Content remains reachable above bottom navigation')
        }
        pageChecks++
      }
    }
    await settings(page); await page.locator('.calm-manage').click(); await page.locator('dialog.calm-modal').waitFor({state:'visible'}); assert.ok(await page.locator('dialog.calm-modal').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight + 2)); await page.keyboard.press('Escape'); await settings(page); await page.locator('.theme-option-dark').click(); await page.locator('.theme-option-custom').click()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    if (width === 390) await page.screenshot({ path: 'qa/after-custom-mobile.png', fullPage: true, animations: 'disabled' })
    await context.close()
  }
  const { page: rtl, context: rtlContext } = await open(390, 'ku')
  await settings(rtl); await rtl.locator('.theme-option-custom').click()
  assert.equal(await rtl.locator('html').getAttribute('dir'), 'rtl')
  assert.ok(await rtl.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  await rtl.screenshot({ path: 'qa/after-custom-rtl.png', fullPage: true, animations: 'disabled' })
  await rtlContext.close()
  assert.deepEqual(errors, [])
  console.log(`PASS: ${pageChecks} page/theme/viewport checks; custom save/cancel/reset/restore/reload/import/export; invalid import; motion persistence/reduced motion/background pause; System changes; RTL. No runtime errors.`)
} finally { await browser.close() }
