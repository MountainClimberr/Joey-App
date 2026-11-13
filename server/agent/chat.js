import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { reply } from './agent.js'

// Fake test employee
const employee = {
  firstName: 'John',
  recentMoods: ['uncomfortable', 'uncomfortable', 'uncomfortable'],
}

const rl = readline.createInterface({ input, output })
let history = []
let pending = null

console.log('Joey test chat. Type "exit" to quit or "reset" to start a new conversation.\n')

while (true) {
  let text
  try {
    text = (await rl.question('You: ')).trim()
  } catch {
    break
  }
  if (!text) continue
  if (text === 'exit') break
  if (text === 'reset') {
    history = []
    pending = null
    console.log('(new conversation)\n')
    continue
  }

  const result = await reply({ history, message: text, employee, pending })

  // Debug line showing what the pipeline decided
  const s = result.safety
  const parts = [`action: ${result.action}`, `severity: ${s.severity}`]
  if (s.category) parts.push(s.category)
  if (s.outputBlocked) parts.push(`blocked: ${s.outputBlocked}`)
  console.log(`  [${parts.join(' | ')}]`)

  let shown = result.text
  if (result.action === 'escalate') {
    console.log('  [real app: backend alerts HR immediately]')
  }
  if (result.action === 'connect_human') {
    // In the real app the backend notifies HR first and only confirms after that succeeds
    console.log('  [real app: backend notifies HR, then sends this confirmation]')
    shown = "Okay. Someone from HR has been told and will reach out to you soon."
  }

  console.log(`Joey: ${shown}\n`)

  // A failed model call is not saved, so you can just send the message again
  if (result.action === 'error') continue

  history.push({ role: 'user', content: text })
  history.push({ role: 'assistant', content: shown })
  pending = result.pending
}
rl.close()
