import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateUncomfortableStreak } from './streak.js'

test('an empty history has no active streak', () => {
  assert.deepEqual(calculateUncomfortableStreak([]), {
    count: 0,
    threshold: 3,
    flagged: false,
    thresholdCheckIn: null,
  })
})

test('a non-uncomfortable latest check-in resets the streak', () => {
  const result = calculateUncomfortableStreak([
    { id: 'today', mood: 'neutral' },
    { id: 'yesterday', mood: 'uncomfortable' },
  ])

  assert.equal(result.count, 0)
  assert.equal(result.flagged, false)
  assert.equal(result.thresholdCheckIn, null)
})

test('the third consecutive uncomfortable check-in hits the threshold', () => {
  const result = calculateUncomfortableStreak([
    { id: 'third', mood: 'uncomfortable' },
    { id: 'second', mood: 'uncomfortable' },
    { id: 'first', mood: 'uncomfortable' },
  ])

  assert.equal(result.count, 3)
  assert.equal(result.flagged, true)
  assert.equal(result.thresholdCheckIn.id, 'third')
})

test('an ongoing streak keeps the original threshold check-in', () => {
  const result = calculateUncomfortableStreak([
    { id: 'fifth', mood: 'uncomfortable' },
    { id: 'fourth', mood: 'uncomfortable' },
    { id: 'third', mood: 'uncomfortable' },
    { id: 'second', mood: 'uncomfortable' },
    { id: 'first', mood: 'uncomfortable' },
  ])

  assert.equal(result.count, 5)
  assert.equal(result.flagged, true)
  assert.equal(result.thresholdCheckIn.id, 'third')
})