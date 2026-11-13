import assert from 'node:assert/strict'
import test from 'node:test'
import { reply, checkOutput } from './agent.js'

// Fake model: records whether it was called and returns a fixed reply.
function fakeModel(answer = 'That sounds hard. What happened?') {
  const calls = []
  return { calls, complete: async (messages) => { calls.push(messages); return answer } }
}

test('normal message goes to the model', async () => {
  const m = fakeModel()
  const r = await reply({ message: 'I had a rough morning' }, m)
  assert.equal(r.action, 'reply')
  assert.equal(r.text, 'That sounds hard. What happened?')
  assert.equal(m.calls.length, 1)
  assert.equal(m.calls[0][0].role, 'system')
})

test('urgent message escalates and never calls the model', async () => {
  const m = fakeModel()
  const r = await reply({ message: 'I want to kill myself' }, m)
  assert.equal(r.action, 'escalate')
  assert.match(r.text, /988/)
  assert.equal(r.pending, 'offer_human')
  assert.equal(m.calls.length, 0)
})

test('high message offers a person and never calls the model', async () => {
  const m = fakeModel()
  const r = await reply({ message: 'My coworker keeps touching me' }, m)
  assert.equal(r.action, 'offer_human')
  assert.equal(r.pending, 'offer_human')
  assert.equal(m.calls.length, 0)
})

test('ambiguous message asks a clarifying question', async () => {
  const m = fakeModel()
  const r = await reply({ message: "I don't want to be here anymore" }, m)
  assert.equal(r.action, 'clarify')
  assert.equal(r.pending, 'check')
  assert.equal(m.calls.length, 0)
})

test('answer "I mean work" after a check continues the conversation', async () => {
  const m = fakeModel()
  const r = await reply({ message: 'I mean work, this job is wearing me down', pending: 'check' }, m)
  assert.equal(r.action, 'reply')
  assert.equal(m.calls.length, 1)
})

test('answer "the second one" after a check escalates', async () => {
  const m = fakeModel()
  const r = await reply({ message: 'the second one', pending: 'check' }, m)
  assert.equal(r.action, 'escalate')
  assert.equal(m.calls.length, 0)
})

test('unclear answer after a check offers a person instead of guessing', async () => {
  const m = fakeModel()
  const r = await reply({ message: 'idk', pending: 'check' }, m)
  assert.equal(r.action, 'offer_human')
  assert.equal(m.calls.length, 0)
})

test('"yes" after an offer connects a human and leaves the confirmation to the backend', async () => {
  const r = await reply({ message: 'yes please', pending: 'offer_human' }, fakeModel())
  assert.equal(r.action, 'connect_human')
  assert.equal(r.text, null)
})

test('"no" after an offer is respected', async () => {
  const m = fakeModel()
  const r = await reply({ message: 'no thanks', pending: 'offer_human' }, m)
  assert.equal(r.action, 'reply')
  assert.equal(m.calls.length, 0)
})

test('urgent wins even while a question is pending', async () => {
  const r = await reply({ message: 'no, I want to kill myself', pending: 'offer_human' }, fakeModel())
  assert.equal(r.action, 'escalate')
})

test('model reply that claims to notify someone is blocked', async () => {
  const r = await reply({ message: 'rough day' }, fakeModel("I'm letting someone from HR know right away."))
  assert.equal(r.safety.outputBlocked, 'claims_action')
  assert.doesNotMatch(r.text, /letting someone/)
})

test('model reply that diagnoses is blocked', async () => {
  assert.equal(checkOutput('It sounds like you have depression.').reason, 'diagnosis')
  assert.equal(checkOutput('That sounds really draining.').ok, true)
})

test('model failure returns a friendly error', async () => {
  const broken = { complete: async () => { throw new Error('429 rate limit') } }
  const r = await reply({ message: 'rough day' }, broken)
  assert.equal(r.action, 'error')
})

test('long conversations are handed to a person', async () => {
  const history = Array.from({ length: 15 }, () => [
    { role: 'user', content: 'still stressed' },
    { role: 'assistant', content: 'I hear you.' },
  ]).flat()
  const m = fakeModel()
  const r = await reply({ message: 'still stressed', history }, m)
  assert.equal(r.action, 'offer_human')
  assert.equal(m.calls.length, 0)
})