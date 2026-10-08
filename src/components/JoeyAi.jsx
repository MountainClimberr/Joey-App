import { useState } from 'react'

function JoeyMark() {
  return (
    <svg viewBox="0 0 48 48" width="30" height="30" aria-hidden="true">
      <defs>
        <linearGradient id="joeyg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a8fa8" />
          <stop offset="1" stopColor="#1b6e8c" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill="url(#joeyg)" />
      <circle cx="17" cy="21" r="2.6" fill="#fff" />
      <circle cx="31" cy="21" r="2.6" fill="#fff" />
      <path d="M16 29 Q24 36 32 29" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function starterMessages(name, role) {
  const first = (name || '').split(' ')[0]
  if (role === 'hr') {
    return [
      { id: 'g1', from: 'joey', text: `Hi ${first}. I'm Joey.` },
      { id: 'g2', from: 'joey', text: 'This is where you’ll be able to ask about your team’s trends.' },
    ]
  }
  return [
    { id: 'g1', from: 'joey', text: `Hi ${first}! I'm Joey.` },
    { id: 'g2', from: 'joey', text: 'I’m here if you want to talk through your day, or just have a quiet place to land.' },
  ]
}

const CHIPS = {
  employee: ['I had a rough morning', 'Help me reset', 'Talk to a human'],
  hr: ['Summarize this week', 'How is the team trending?'],
}

/**
 * Left-hand Joey chat panel (UI shell).
 *
 * TODO: wire this up.
 *  - messages: [{ id, from: 'joey' | 'user', text }]  (omit to show the greeting)
 *  - onSend(text): called on submit / chip click. If omitted, the input is disabled.
 */
export default function JoeyAi({ name, role, messages, onSend }) {
  const [draft, setDraft] = useState('')
  const log = messages ?? starterMessages(name, role)
  const ready = typeof onSend === 'function'

  function submit(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !ready) return
    onSend(text)
    setDraft('')
  }

  return (
    <aside className="joey" aria-label="Joey assistant">
      <header className="joey-head">
        <div className="joey-avatar"><JoeyMark /></div>
        <div>
          <strong>Joey</strong>
          <span className="joey-status"><i /> {ready ? 'Here whenever you need' : 'Chat coming soon'}</span>
        </div>
      </header>

      <div className="joey-log">
        {log.map((m) => (
          <div key={m.id} className={`bubble ${m.from === 'user' ? 'user-msg' : 'joey-msg'}`}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="joey-chips">
        {(CHIPS[role] ?? CHIPS.employee).map((c) => (
          <button key={c} disabled={!ready} onClick={() => onSend?.(c)}>{c}</button>
        ))}
      </div>

      <form className="joey-input" onSubmit={submit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={ready ? 'Message Joey…' : 'Joey chat is coming soon'}
          disabled={!ready}
          aria-label="Message Joey"
        />
        <button type="submit" disabled={!ready || !draft.trim()} aria-label="Send">➤</button>
      </form>

      <p className="joey-foot">Joey is an AI assistant, not a substitute for professional help.</p>
    </aside>
  )
}