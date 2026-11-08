// Disposable local-only data, using the same CI server as the FOCUS browser audit.
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH })
const errors = []
mkdirSync('mobile-qa-artifacts', { recursive: true })
try {
  for (const width of [320, 390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(process.env.FOCUS_TEST_URL || 'http://127.0.0.1:4175', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'MUSE', exact: true }).click()
    const muse = page.locator('.muse')
    await muse.getByRole('button', { name: 'Start an outing', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: /University/ }).click()
    const rows = muse.locator('.checklist-row')
    assert.equal(await rows.count(), 4)
    assert.equal(await muse.getByRole('button', { name: 'Start outing', exact: true }).isDisabled(), true)
    await rows.nth(0).getByRole('button', { name: 'Ready', exact: true }).click()
    for (let i = 1; i < 4; i++) await rows.nth(i).getByRole('button', { name: 'Not taking', exact: true }).click()
    await muse.getByRole('button', { name: 'Start outing', exact: true }).click()
    await page.getByRole('button', { name: 'FOCUS', exact: true }).click()
    await page.getByRole('button', { name: 'MUSE', exact: true }).click()
    await muse.getByRole('button', { name: 'Check my belongings', exact: true }).click()
    assert.equal(await rows.count(), 1, 'Return should contain only items actually taken')
    assert.equal(await rows.locator('button.selected').count(), 0, 'Return must never be assumed')
    assert.equal(await muse.getByRole('button', { name: 'Finish check', exact: true }).isDisabled(), true)
    await rows.getByRole('button', { name: 'Missing', exact: true }).click()
    await muse.getByRole('button', { name: 'Finish check', exact: true }).click()
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'MUSE', exact: true }).click()
    await muse.getByRole('button', { name: 'My life', exact: true }).click()
    await muse.getByRole('button', { name: 'Mark found', exact: true }).waitFor()
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('focus:muse:v1:local')))
    assert.equal(saved.state.outings[0].state, 'finished')
    assert.equal(saved.state.outings[0].items[0].returned, 'missing')
    for (const name of ['Today', 'My life', 'Memory', 'Assistant']) {
      await muse.getByRole('button', { name, exact: true }).click()
      const bounds = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }))
      assert.ok(bounds.content <= bounds.width + 4, `Muse overflow: ${width}/${name}: ${JSON.stringify(bounds)}`)
    }
    await muse.getByRole('button', { name: 'Today', exact: true }).click()
    await page.screenshot({ path: `mobile-qa-artifacts/muse-${width}.png`, fullPage: true })
    await context.close()
    console.log(`PASS Muse ${width}px: explicit return, missing item persistence, navigation and layout`)
  }
} finally { await browser.close() }
assert.deepEqual(errors, [])
