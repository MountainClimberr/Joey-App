import { filterEscalation } from './filter.js'
import { buildSystemPrompt } from './prompt.js'

const MAX_USER_TURNS = 15

const REPLIES = {
  urgent: {
    self_harm: 
          "Thank you for telling me. What you're feeling matters, and you deserve support from a person right now. " +
      'If you might act on these thoughts, please call or text 988 now, or call 911 if you are in immediate danger. ' +
      'Would you like me to connect you with someone from HR?',
    abuse:
      "Thank you for telling me. Your safety comes first. If you are in danger right now, please call 911. " +
      'Would you like me to connect you with someone from HR?',
    violence_to_others:
      "It sounds like things have reached a breaking point. Please don't act on that. " +
      'If anyone is in immediate danger, call 911. I would like to connect you with someone from HR now. Is that okay?',
  },
  high: {
    self_harm:
      "Thank you for trusting me with that. This is something a person should help with, not just me. " +
      'You can call or text 988 any time, day or night. Would you like me to connect you with someone from HR? ' +
      'Nothing is shared unless you say yes.',
    default:
      "Thank you for trusting me with that. This is something a person should help with, not just me. " +
      'Would you like me to connect you with someone from HR? Nothing is shared unless you say yes.',
  },
  check:
    "I want to make sure I understand. Do you mean you don't want to be at work right now, " +
    'or are you having thoughts of not wanting to be alive? Either answer is okay to say here.',
  unclearAfterCheck:
    "I'm not sure I understood, and I'd rather check than guess. Would you like me to connect you with someone from HR? " +
    'If you are thinking about hurting yourself, you can call or text 988 any time.',
  declinedHuman:
    "That's okay. I'm still here if you want to keep talking. What's been weighing on you most?",
  turnLimit:
    "We've covered a lot. I think talking this through with a person could help more than I can. " +
    'Would you like me to connect you with someone from HR?',
  modelError:
    "Sorry, I can't reply right now. Please try again in a few minutes. " +
    'If you need to talk to someone, you can reach HR directly.',
  unsafeOutput:
    "I want to make sure I respond to that properly. Could you tell me a little more about what's going on?",
}

// Reading the employee's answer to a question Joey asked
const YES = /^\s*(yes|yeah|yep|yup|sure|ok|okay|please|please do|i would|do it|go ahead)\b/i
const NO = /^\s*(no|nope|nah|not now|i am okay|i'm okay|im okay|i'm fine|im fine|no thanks)\b/i
const MEANS_WORK = /\b(work|job|office|the first|first one|just work|at work|here at work|quit)\b/i
const MEANS_ALIVE = /\b(alive|second|the second|living|die|dying|hurt myself|end it|yes)\b/i
 
// Output check: things the model must never say
const FALSE_ACTION =
  /\b(?:i(?:'ve| have| am|'m|'ll| will)?)\s+(?:notif\w*|contact\w*|alert\w*|report\w*|escalat\w*|let(?:ting)?\s+(?:someone|hr|your))/i
const DIAGNOSIS =
  /\byou\s+(?:have|might have|may have|probably have|sound like you have|seem to have)\s+(?:depression|anxiety|ptsd|bipolar|adhd|ocd|burnout|a disorder|a mental illness)\b/i
 
export function checkOutput(text) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, reason: 'empty' }
  if (FALSE_ACTION.test(text)) return { ok: false, reason: 'claims_action' }
  if (DIAGNOSIS.test(text)) return { ok: false, reason: 'diagnosis' }
  return { ok: true, reason: null }
}
 
function result(text, action, safety, pending = null) {
  return { text, action, safety, pending }
}

// message reply stream
export async function reply({ history = [], message, employee = {}, pending = null }, deps = {}) {
  const safety = filterEscalation(message)

  // 1. Urgent always wins, whatever was pending
  if (safety.severity === 'urgent') {
    const text = REPLIES.urgent[safety.category] ?? REPLIES.urgent.self_harm
    return result(text, 'escalate', safety, 'offer_human')
  }

  // 2. The employee is answering a question Joey asked last turn
  if (pending === 'offer_human' && safety.severity === 'none') {
    if (YES.test(message)) return result(null, 'connect_human', safety)
    if (NO.test(message)) return result(REPLIES.declinedHuman, 'reply', safety)
    // Anything else: they kept talking instead of answering. Carry on normally
  }

  if (pending === 'check' && safety.severity === 'none') {
    if (MEANS_ALIVE.test(message) && !MEANS_WORK.test(message)) {
      const s = { flagged: true, category: 'self_harm', severity: 'urgent', reason: 'confirmed_after_check' }
      return result(REPLIES.urgent.self_harm, 'escalate', s, 'offer_human')
    }
    if (!MEANS_WORK.test(message)) {
      return result(REPLIES.unclearAfterCheck, 'offer_human', safety, 'offer_human')
    }
    // They meant work: fall through to a normal model reply
  }

  // 3. Fixed replies for high and check
  if (safety.severity === 'high') {
    const text = REPLIES.high[safety.category] ?? REPLIES.high.default
    return result(text, 'offer_human', safety, 'offer_human')
  }
  if (safety.severity === 'check') {
    return result(REPLIES.check, 'clarify', safety, 'check')
  }

  // 4. Long conversations get handed to a person instead of going on forever
  const userTurns = history.filter((m) => m.role === 'user').length
  if (userTurns >= MAX_USER_TURNS) {
    return result(REPLIES.turnLimit, 'offer_human', safety, 'offer_human')
  }

  // 5. Normal conversation: call the model
  const complete = deps.complete ?? (await import('./llm.js')).complete
  const messages = [
    { role: 'system', content: buildSystemPrompt(employee) },
    ...history,
    { role: 'user', content: message },
  ]

  let text
  try {
    const complete = await loadComplete(deps)
    text = await complete(messages)
  } catch (err) {
    return result(REPLIES.modelError, 'error', safety)
  }

  // 6. Check what the model said before the employee sees it
  const out = checkOutput(text)
  if (!out.ok) {
    return result(REPLIES.unsafeOutput, 'reply', { ...safety, outputBlocked: out.reason })
  }

  return result(text, 'reply', safety)
}
