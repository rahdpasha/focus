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
    if (width <= 390) {
      // An actual phone width should lead with tasks/actions, not a second
      // desktop header and a giant decorative hero.
      await muse.locator('.hero-cta').waitFor()
      assert.equal(await muse.locator('.muse-header').isVisible(), false)
      const hero = await muse.locator('.hero').boundingBox()
      assert.ok(hero && hero.height < 110, 'Muse mobile quick capture should be compact')
      assert.equal(await muse.locator('.muse-tabs button').count(), 5)
      assert.equal(await muse.locator('.muse-greeting-phone').isVisible(), true)
      const surface = await page.evaluate(() => {
        const el = document.querySelector('.muse')
        const shell = document.querySelector('.calm-app')
        const content = document.querySelector('main.calm-content')
        const footer = document.querySelector('.muse .page-footer')
        const emptyTasks = document.querySelector('.muse .empty-tasks')
        return {
          museMode: shell.classList.contains('calm-app--muse'),
          background: getComputedStyle(el).backgroundColor,
          overflow: getComputedStyle(el).overflowX,
          bottomPadding: parseFloat(getComputedStyle(content).paddingBottom),
          emptyBorder: emptyTasks ? getComputedStyle(emptyTasks).borderTopWidth : null,
          footerVisible: footer ? getComputedStyle(footer).display !== 'none' : false,
        }
      })
      assert.equal(surface.museMode, true, 'Muse should use its own shell layout')
      assert.equal(surface.background, 'rgba(0, 0, 0, 0)', 'Muse root should not paint a cut-off dark rectangle')
      assert.equal(surface.overflow, 'visible', 'Muse page should not clip vertical content')
      assert.ok(surface.bottomPadding < 100, 'Muse should not keep the FOCUS bottom dock spacer')
      assert.equal(surface.emptyBorder, '0px', 'Muse empty state should not show a dashed frame')
      assert.equal(surface.footerVisible, false, 'Mobile Muse should omit decorative footer')
      const bodyEdges = await page.evaluate(() => {
        const rect = document.querySelector('.muse').getBoundingClientRect()
        const content = document.querySelector('main.calm-content').getBoundingClientRect()
        return {left: rect.left, right: rect.right, contentLeft: content.left, contentRight: content.right, viewport: innerWidth}
      })
      assert.ok(bodyEdges.left >= 0 && bodyEdges.right <= bodyEdges.viewport + 1,
        'Muse should fit entirely inside the phone: ' + JSON.stringify(bodyEdges))
      assert.equal(await muse.locator('.muse-greeting-desktop').isVisible(), false)
      await page.evaluate(() => window.scrollTo(0, 400))
      await page.waitForTimeout(80)
      const sticky = await page.evaluate(() => {
        const header = document.querySelector('.calm-topbar')
        const switcher = document.querySelector('.experience-switch')
        return {
          top: header.getBoundingClientRect().top,
          position: getComputedStyle(header).position,
          right: switcher.getBoundingClientRect().right,
          width: innerWidth,
          scrollTop: document.scrollingElement.scrollTop,
        }
      })
      assert.ok(sticky.scrollTop > 50 && sticky.position === 'fixed' && Math.abs(sticky.top) <= 2, 'Muse switch must stay visible during scroll: ' + JSON.stringify(sticky))
      assert.ok(sticky.right <= sticky.width + 1, 'Muse switch clipped on phone')
      await page.evaluate(() => window.scrollTo(0, 0))
      const metrics = await page.evaluate(() => ({
        window: innerWidth,
        document: document.documentElement.scrollWidth,
      }))
      assert.ok(metrics.document <= metrics.window + 4, 'MUSE mobile has horizontal overflow')
    }
    // The iPhone settings modal must open below the status bar, even when
    // the page was previously scrolled and the dialog was opened before.
    if (width <= 390) {
      await muse.locator('.muse-options').click()
      const settingsDialog = page.locator('.muse dialog[open]')
      await settingsDialog.waitFor()
      const modalBounds = await settingsDialog.evaluate(el => {
        const dialog = el.getBoundingClientRect()
        const title = el.querySelector('.modal-content h2').getBoundingClientRect()
        const close = el.querySelector('.modal-close').getBoundingClientRect()
        return {
          modalTop: dialog.top, modalBottom: dialog.bottom,
          titleTop: title.top, closeTop: close.top, closeBottom: close.bottom,
          viewportHeight: innerHeight, scrollTop: el.scrollTop,
          maxScroll: el.scrollHeight - el.clientHeight,
        }
      })
      assert.ok(modalBounds.modalTop >= 65, 'Settings modal should start below phone status area: ' + JSON.stringify(modalBounds))
      assert.ok(modalBounds.titleTop >= modalBounds.modalTop && modalBounds.titleTop < modalBounds.viewportHeight,
        'Settings title is clipped: ' + JSON.stringify(modalBounds))
      assert.ok(modalBounds.closeTop >= modalBounds.modalTop && modalBounds.closeBottom <= modalBounds.viewportHeight,
        'Settings close control is clipped: ' + JSON.stringify(modalBounds))
      assert.ok(modalBounds.modalBottom <= modalBounds.viewportHeight - 8,
        'Settings should fit within viewport: ' + JSON.stringify(modalBounds))
      await settingsDialog.evaluate(el => { el.scrollTop = Math.min(250, el.scrollHeight - el.clientHeight) })
      await page.keyboard.press('Escape')
      await muse.locator('.muse-options').click()
      const reopenedTop = await settingsDialog.evaluate(el => el.scrollTop)
      assert.equal(reopenedTop, 0, 'Reopened settings must start at the title, not the previous scroll position')
      await page.keyboard.press('Escape')
    }
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
    await muse.locator('.history-row summary').click()
    await muse.getByRole('button', { name: 'Mark found', exact: true }).waitFor()
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('focus:muse:v1:local')))
    assert.equal(saved.state.outings[0].state, 'finished')
    assert.equal(saved.state.outings[0].items[0].returned, 'missing')
    // Real form interactions, with every weekday selected so the test is date independent.
    await muse.getByRole('button', { name: 'Add routine', exact: true }).click()
    await muse.getByLabel('Routine name', { exact: true }).fill('Daily bag check')
    await muse.getByLabel('Departure time', { exact: true }).fill('00:00')
    await muse.getByLabel('Return check time', { exact: true }).fill('23:59')
    for (const checkbox of await muse.locator('.routine-days input').all()) await checkbox.check()
    await muse.getByRole('button', { name: 'Save routine', exact: true }).click()
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'MUSE', exact: true }).click()
    await muse.getByRole('button', { name: 'Snooze 15 min', exact: true }).click()
    assert.equal(await muse.getByRole('button', { name: 'Snooze 15 min', exact: true }).count(), 0)
    await muse.getByRole('button', { name: 'Open checklist', exact: true }).click()
    assert.equal(await rows.count(), 4)
    assert.equal(await muse.getByRole('button', { name: 'Open checklist', exact: true }).count(), 0)
    const routineSaved = await page.evaluate(() => JSON.parse(localStorage.getItem('focus:muse:v1:local')))
    assert.equal(routineSaved.state.routineOccurrences[0].outingId, routineSaved.state.outings[0].id)
    assert.ok(routineSaved.state.outings[0].returnReminderAt)
    assert.ok(routineSaved.state.outings[0].items.every(i => i.returned === 'unanswered'))
    // A routine can be deleted on My life, after confirmation, while
    // its already-started outing and occurrence history remain intact.
    const routineId = routineSaved.state.routines[0].id
    await muse.getByRole('button', { name: 'My life', exact: true }).click()
    const scheduledRoutine = muse.locator('.routine-panel .routine-row').filter({ hasText: 'Daily bag check' })
    assert.equal(await scheduledRoutine.count(), 1)
    page.once('dialog', dialog => dialog.dismiss())
    await scheduledRoutine.getByRole('button', { name: 'Delete Daily bag check' }).click()
    assert.equal(await scheduledRoutine.count(), 1, 'Cancel should leave the routine unchanged')
    page.once('dialog', dialog => dialog.accept())
    await scheduledRoutine.getByRole('button', { name: 'Delete Daily bag check' }).click()
    assert.equal(await scheduledRoutine.count(), 0, 'Confirmed delete should remove the recurring schedule')
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'MUSE', exact: true }).click()
    await muse.getByRole('button', { name: 'My life', exact: true }).click()
    assert.equal(await muse.getByRole('button', { name: 'Delete Daily bag check' }).count(), 0)
    const afterDelete = await page.evaluate(() => JSON.parse(localStorage.getItem('focus:muse:v1:local')))
    assert.ok(!afterDelete.state.routines.some(r => r.id === routineId), 'Deleted schedule must stay deleted after reload')
    assert.ok(afterDelete.state.outings.length >= 1, 'Deleting a routine must keep outing history')
    assert.ok(afterDelete.state.routineOccurrences.some(o => o.routineId === routineId && o.status === 'started'),
      'Deleting a routine must keep past completed occurrence records')
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
