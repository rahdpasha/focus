import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const plan = readFileSync('src/pages/PlanPage.tsx', 'utf8')
const focus = readFileSync('src/pages/FocusPage.tsx', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const css = readFileSync('src/calm.css', 'utf8')

test('Plan navigation exposes the existing Advisor screen again', () => {
  assert.match(plan, /id: 'advisor' as const/)
  assert.match(plan, /label: tr\('AI Advisor'/)
  assert.match(plan, /section ===\s*'advisor'/)
  assert.match(plan, /<AdvisorPage/)
})

test('Focus home links directly to Advisor with the correct initial tab', () => {
  assert.match(focus, /className="calm-advisor-link" onClick=\{onAdvisor\}/)
  assert.match(app, /onAdvisor=\{openAdvisor\}/)
  assert.match(app, /setPlanEntry\('advisor'\)/)
  assert.match(app, /initialSection=\{planEntry\}/)
  assert.match(plan, /useState<PlanSection>\(\s*subjectCreateRequestKey > 0 \? 'subjects' : initialSection/)
})

test('restored Advisor shortcut remains responsive and visible', () => {
  assert.match(css, /\.calm-advisor-link\s*\{/)
  assert.match(readFileSync('public/sw.js','utf8'), /focus-pwa-v10-advisor-access/)
})
