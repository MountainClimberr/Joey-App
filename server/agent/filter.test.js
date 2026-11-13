import assert from 'node:assert/strict'
import test from 'node:test'
import { filterEscalation } from './filter.js'

const sev = (t) => filterEscalation(t).severity
const cat = (t) => filterEscalation(t).category

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

test('catches contractions and missing apostrophes', () => {
  assert.equal(sev("I'm suicidal"), 'high')
  assert.equal(sev('im suicidal'), 'high')
  assert.equal(sev('i dont want to live anymore'), 'urgent')
  assert.equal(sev("I'm going to end it all"), 'urgent')
  assert.equal(sev('I WANT TO KILL MYSELF'), 'urgent')
})
 
test('flags ambiguous phrases for a clarifying check', () => {
  assert.equal(sev("I don't want to be here anymore"), 'check')
  assert.equal(sev('I dont want to be here anymore'), 'check')
  assert.equal(sev("I can't do this anymore"), 'check')
  assert.equal(sev("what's the point"), 'check')
})
 
test('urgent wins when a message has both ambiguous and urgent signals', () => {
  assert.equal(sev("I can't do this anymore, I want to kill myself"), 'urgent')
})
 
test('flags workplace harassment and discrimination as high', () => {
  assert.equal(cat('My coworker keeps touching me'), 'harassment')
  assert.equal(sev('My coworker keeps touching me'), 'high')
  assert.equal(cat('my manager is bullying me'), 'harassment')
  assert.equal(cat("I'm being passed over because I'm pregnant"), 'discrimination')
  assert.equal(sev("I'm being passed over because I'm pregnant"), 'high')
})
 
test('flags threats of violence toward others as urgent', () => {
  assert.equal(cat("I'm going to hurt my manager"), 'violence_to_others')
  assert.equal(sev("I'm going to hurt my manager"), 'urgent')
})
 
test('does not escalate common workplace complaints and idioms', () => {
  for (const text of [
    'this deadline is killing me',
    'I could kill for a coffee',
    'my boss threatened to fire me',
    'my manager threatened to write me up',
    'I was hurt when my manager ignored me',
    'I have been hurt by the reorg',
    'this project is going to be the death of me',
    'my manager keeps giving me impossible deadlines',
  ]) {
    assert.equal(filterEscalation(text).flagged, false, text)
  }
})
 
test('handles negation and third-party mentions without urgent escalation', () => {
  assert.notEqual(sev('I would never hurt myself'), 'urgent')
  assert.notEqual(sev('My friend said she wants to kill herself'), 'urgent')
})