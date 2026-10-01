import { useAuth } from '../auth/context.js'

export default function DevRoleSwitcher() {
  const { user } = useAuth()
  if (import.meta.env.VITE_USE_MOCK !== 'true' || !user) return null

  function pick(role) {
    localStorage.setItem('joey-mock-role', role)
    window.location.reload()
  }

  return (
    <div style={{ position: 'fixed', bottom: 12, right: 12, background: '#fff', border: '1px solid #ccc', borderRadius: 10, padding: 8, fontSize: 13 }}>
      DEV role: <b>{user.role}</b>{' '}
      <button onClick={() => pick('employee')}>Employee</button>{' '}
      <button onClick={() => pick('hr')}>HR</button>
    </div>
  )
}