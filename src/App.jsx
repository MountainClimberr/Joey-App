import { useState } from 'react'
import AuthProvider from './auth/AuthProvider.jsx'
import { useAuth } from './auth/context.js'
import CheckIn from './components/CheckIn.jsx'
import Insights from './components/Insights.jsx'
import Roster from './components/Roster.jsx'
import DevRoleSwitcher from './components/DevRoleSwitcher.jsx'
import './App.css'


const VIEWS = {
  checkin: { label: 'Check-in', roles: ['employee'], Component: CheckIn },
  team: { label: 'Team', roles: ['hr'], Component: Roster },
  insights: { label: 'Team Insights', roles: ['hr'], Component: Insights },
}

function Shell() {
  const { status, user } = useAuth()
  const [view, setView] = useState('checkin')

  if (status === 'loading') return <main className="app"><p className="note">Loading…</p></main>
  if (status === 'error') {
    return <main className="app"><p className="note warn">Couldn't verify your account. Open Joey from Microsoft Teams.</p></main>
  }

  const allowed = Object.entries(VIEWS).filter(([, v]) => v.roles.includes(user.role))
  const current = allowed.some(([key]) => key === view) ? view : allowed[0][0]  
  const { Component } = VIEWS[current]

  return (
    <main className="app">
      {allowed.length > 1 && (
        <nav className="tabs">
          {allowed.map(([key, v]) => (
            <button key={key} className={current === key ? 'active' : ''} onClick={() => setView(key)}>
              {v.label}
            </button>
          ))}
        </nav>
      )}
      <Component />
    </main>
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