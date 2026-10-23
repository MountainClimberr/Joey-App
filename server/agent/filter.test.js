import assert from 'node:assert/strict'
import test from 'node:test'
import { filterEscalation } from './filter.js'

test('flags an immediate self-harm statement as urgent', () => {
  assert.deepEqual(filterEscalation('I want to kill myself tonight'), {
    flagged: true,
    category: 'self_harm',
    severity: 'urgent',
    reason: 'immediate_self_harm_risk',
  })
  assert.equal(filterEscalation('I am thinking about killing myself').severity, 'urgent')
  assert.equal(filterEscalation('I do not want to be alive').severity, 'urgent')
})

test('flags a self-harm disclosure as high severity', () => {
  const result = filterEscalation('I have been self-harming')

  assert.equal(result.flagged, true)
  assert.equal(result.category, 'self_harm')
  assert.equal(result.severity, 'high')
})

test('flags an immediate abuse disclosure as urgent', () => {
  const result = filterEscalation('My partner is hitting me')

  assert.equal(result.flagged, true)
  assert.equal(result.category, 'abuse')
  assert.equal(result.severity, 'urgent')
  assert.equal(filterEscalation('My father is threatening me').severity, 'urgent')
})

test('flags a non-immediate abuse disclosure as high severity', () => {
  const result = filterEscalation('I was abused as a child')

  assert.equal(result.flagged, true)
  assert.equal(result.category, 'abuse')
  assert.equal(result.severity, 'high')
})

test('does not escalate ordinary, empty, or non-string input', () => {
  const expected = {
    flagged: false,
    category: null,
    severity: 'none',
    reason: null,
  }

  assert.deepEqual(filterEscalation('I had a rough morning'), expected)
  assert.deepEqual(filterEscalation('   '), expected)
  assert.deepEqual(filterEscalation(null), expected)
})