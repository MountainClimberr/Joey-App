import { useState } from 'react'
import AuthProvider from './auth/AuthProvider.jsx'
import { useAuth } from './auth/context.js'
import CheckIn from './components/CheckIn.jsx'
import MyCheckins from './components/MyCheckins.jsx'
import Insights from './components/Insights.jsx'
import Roster from './components/Roster.jsx'
import JoeyAi from './components/JoeyAi.jsx'
import DevRoleSwitcher from './components/DevRoleSwitcher.jsx'
import Avatar from './components/Avatar.jsx'
import NeedsAttention from './components/NeedsAttention.jsx'
import './App.css'

const VIEWS = {
  checkin: { label: 'Check-in', roles: ['employee'], Component: CheckIn },
  history: { label: 'My check-ins', roles: ['employee'], Component: MyCheckins },
  team: { label: 'Team', roles: ['hr'], Component: Roster },
  insights: { label: 'Team Insights', roles: ['hr'], Component: Insights },
}

function Shell() {
  const { status, user } = useAuth()
  const [view, setView] = useState(null)
  const [focus, setFocus] = useState(null) // { person, n }: open this person's week on the Team page
  const [today] = useState(() =>
    new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
  )

  if (status === 'loading') return <div className="splash"><p className="note">Loading…</p></div>
  if (status === 'error') {
    return <div className="splash"><p className="note warn">Couldn't verify your account. Open Joey from Microsoft Teams.</p></div>
  }

  const allowed = Object.entries(VIEWS).filter(([, v]) => v.roles.includes(user.role))
  const current = allowed.some(([key]) => key === view) ? view : allowed[0][0]
  const { Component } = VIEWS[current]

  return (
    <div className="shell">
      <JoeyAi name={user.name} role={user.role} />

      <main className="stage">
        <header className="topbar">
          {allowed.length > 1 ? (
            <nav className="tabs">
              {allowed.map(([key, v]) => (
                <button key={key} className={current === key ? 'active' : ''} onClick={() => { setView(key); setFocus(null) }}>
                  {v.label}
                </button>
              ))}
            </nav>
          ) : (
            <span className="date">{today}</span>
          )}

          <div className="topbar-right">
            {user.role === 'hr' && (
              <NeedsAttention
                onViewPerson={(person) => {
                  setView('team')
                  setFocus((f) => ({ person, n: (f?.n ?? 0) + 1 }))
                }}
              />
            )}
            <div className="user-chip">
              <Avatar name={user.name} photo={user.photo} size={32} />
              <span>{user.name}</span>
              <em className={`role ${user.role}`}>{user.role === 'hr' ? 'HR' : 'Employee'}</em>
            </div>
          </div>
        </header>

        <div className="content">
          {current === 'team'
            ? <Component key={focus?.n ?? 0} focusPerson={focus?.person} />
            : <Component />}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
      <DevRoleSwitcher />
    </AuthProvider>
  )
}