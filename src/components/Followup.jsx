import { useState } from 'react'
import { submitFollowUp } from '../api.js'

export default function FollowUp({ employeeId, mood }) {
  const [step, setStep] = useState('prompt') // prompt | choose | done
  const [text, setText] = useState('')
  const [shared, setShared] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)

  function finish(doneMessage) {
    setMessage(doneMessage)
    setStep('done')
  }

  async function send(kind, data, doneMessage) {
    setError(false)
    try {
      await submitFollowUp(employeeId, kind, data)
      finish(doneMessage)
    } catch {
      setError(true)
    }
  }

  if (step === 'done') return <p className="note">{message}</p>

  return (
    <div className="followup">
      {mood === 'comfortable' && (
        <>
          <h2>Love that. Want to note what's going well today?</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Optional. Even “nothing special” counts."
            rows={3}
          />
          <label className="check">
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
            Share with my team (otherwise it stays in my private log)
          </label>
          <div className="actions">
            <button className="primary" onClick={() => send('note', { text, shared }, 'Saved. Have a great day.')}>
              Save
            </button>
            <button onClick={() => finish('No problem. Have a great day.')}>Skip</button>
          </div>
        </>
      )}

      {mood === 'neutral' && (
        <>
          <h2>Thanks for checking in. Anything you want to talk about?</h2>
          <div className="actions">
            <button onClick={() => send('reply', { reply: 'all-good' }, 'Glad to hear it.')}>All good</button>
            <button onClick={() => send('reply', { reply: 'a-bit-off' }, 'Thanks for telling us. We’re here if you want to talk.')}>
              A bit off
            </button>
            <button onClick={() => send('reply', { reply: 'rather-not-say' }, 'That’s completely fine.')}>
              Rather not say
            </button>
          </div>
        </>
      )}

      {mood === 'uncomfortable' && step === 'prompt' && (
        <>
          <h2>Thanks for being honest. Do you want to talk about it?</h2>
          <div className="choices">
            <button onClick={() => setStep('choose')}>
              <strong>Talk now</strong>
              <span>Choose a bot or a human</span>
            </button>
            <button onClick={() => send('talk-choice', { choice: 'later' }, 'No pressure. We’re here whenever you want.')}>
              <strong>Maybe later</strong>
              <span>We’re here whenever you want</span>
            </button>
            <button onClick={() => send('talk-choice', { choice: 'log' }, 'Recorded. No conversation needed.')}>
              <strong>Just log it</strong>
              <span>Recorded, no conversation</span>
            </button>
            <button onClick={() => send('talk-choice', { choice: 'read' }, 'A self-serve resource will appear here once HR provides the content.')}>
              <strong>Read something</strong>
              <span>A resource to try on your own</span>
            </button>
          </div>
          <p className="note private">Private by default. Nothing here goes to your manager or your review.</p>
        </>
      )}

      {mood === 'uncomfortable' && step === 'choose' && (
        <>
          <h2>It’s your call</h2>
          <div className="choices two">
            <button onClick={() => send('conversation', { with: 'bot' }, 'Connecting you to Joey… (bot chat coming soon)')}>
              <strong>A bot</strong>
              <span>private · instant · any time</span>
            </button>
            <button onClick={() => send('conversation', { with: 'human' }, 'Request sent. A real person from HR or EAP will reach out to find a time.')}>
              <strong>A human</strong>
              <span>a real person · confidential · HR or EAP</span>
            </button>
          </div>
          <p className="note private">Private by default. Nothing here goes to your manager or your review.</p>
        </>
      )}

      {error && <p className="note warn">Couldn't save that. Please try again.</p>}
    </div>
  )
}