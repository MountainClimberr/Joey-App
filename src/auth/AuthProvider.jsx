import { useEffect, useState } from 'react'
import { getMe } from '../api.js'
import { AuthContext } from './context.js'

export default function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null })

  useEffect(() => {
    getMe()
      .then((user) => setState({ status: 'ready', user }))
      .catch(() => setState({ status: 'error', user: null }))
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}