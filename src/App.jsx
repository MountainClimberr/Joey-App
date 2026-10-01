import { useState } from 'react'
import CheckIn from './components/CheckIn.jsx'
import Insights from './components/Insights.jsx'
import './App.css'

export default function App() {
  const [view, setView] = useState('checkin')
  return (
    <main className="app">
      <nav className="tabs">
        <button className={view === 'checkin' ? 'active' : ''} onClick={() => setView('checkin')}>
          Check-in
        </button>
        <button className={view === 'insights' ? 'active' : ''} onClick={() => setView('insights')}>
          Team Insights
        </button>
      </nav>
      {view === 'checkin' ? <CheckIn /> : <Insights />}
    </main>
  )
}