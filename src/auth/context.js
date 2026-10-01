import { createContext, useContext } from 'react'

export const AuthContext = createContext({ status: 'loading', user: null })
export const useAuth = () => useContext(AuthContext)