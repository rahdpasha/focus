import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const focusPage = readFileSync('src/pages/FocusPage.tsx', 'utf8')
const settings = readFileSync('src/components/settings/Settings.tsx', 'utf8')

test('background push permission is managed in Settings, not the Focus timer', () => {
  assert.doesNotMatch(focusPage, /handleEnableBackgroundAlerts|Enable background alerts/)
  assert.match(settings, /settingsSection === 'alerts'/)
  assert.match(settings, /Enable background alerts/)
  assert.match(settings, /Enabled on this device/)
  assert.match(settings, /Turn off/)
  assert.match(settings, /prepareFocusBackgroundPush/)
})

test('background push opt-in stays accessible after enabling', () => {
  assert.match(settings, /pushStatus === 'on'/)
  assert.match(settings, /handlePushDisable/)
  assert.match(settings, /handlePushEnable/)
  assert.match(settings, /role="status"/)
})
