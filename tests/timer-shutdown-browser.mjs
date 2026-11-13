// Reboot simulation for the same persisted timer state used by Mac, iOS PWA
// and desktop Safari. Runs only against CI's disposable local-only app.
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(process.env.FOCUS_TEST_URL || 'http://127.0.0.1:4175', {
      waitUntil: 'networkidle',
    })
    await page.getByRole('button', { name: 'Start focus', exact: true }).click()
    const key = 'focus.activeTimer.v1:local'
    await page.waitForFunction(key => {
      const raw = localStorage.getItem(key)
      return raw && JSON.parse(raw).isStudying === true
    }, key)

    const initial = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)
    assert.ok(initial.timerEndAt > Date.now(), 'Start must persist a wall-clock deadline')
    assert.ok(initial.sessionClientId, 'Focus session ID must persist')

    // Simulate full device shutdown: destroy the whole page, then reopen it.
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Pause', exact: true }).waitFor()
    const resumed = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)
    assert.equal(resumed.sessionClientId, initial.sessionClientId)
    assert.equal(resumed.timerEndAt, initial.timerEndAt)

    // Simulate powering back on after the scheduled deadline has passed.
    await page.evaluate(key => {
      const saved = JSON.parse(localStorage.getItem(key))
      saved.timerEndAt = Date.now() - 5000
      saved.sessionStartedAt = Date.now() - (saved.focusDuration + 5) * 1000
      saved.timeRemaining = 1
      localStorage.setItem(key, JSON.stringify(saved))
    }, key)
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('.timer-v5-complete').waitFor({ timeout: 15000 })
    const finished = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)
    assert.equal(finished.isStudying, false, 'Expired session must not remain active')
    assert.equal(finished.isCompleted, true, 'Completion must be durable')
    assert.equal(finished.timeRemaining, 0, 'Expired focus time must be zero')
    assert.equal(finished.sessionClientId, initial.sessionClientId)

    // A second restart must show the saved completion, not an inert Pause button
    // or a second recorded focus session.
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('.timer-v5-complete').waitFor({ timeout: 15000 })
    assert.equal(await page.getByRole('button', { name: 'Pause', exact: true }).count(), 0)
    assert.deepEqual(errors, [], 'Browser errors during reboot restore: ' + errors.join(', '))
    await context.close()
    console.log('PASS focus timer survives reboot at width ' + width)
  }
} finally {
  await browser.close()
}
