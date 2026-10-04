import { createContext, useContext, useEffect, useState } from 'react'
import { ACCESS_KEY, clearTokens } from '../api/client'
import * as authApi from '../api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(() => !!localStorage.getItem(ACCESS_KEY))

  useEffect(() => {
    if (!localStorage.getItem(ACCESS_KEY)) return
    authApi
      .getProfile()
      .then(setAdmin)
      .catch(() => clearTokens())
      .finally(() => setLoading(false))
  }, [])

  async function login(email, motDePasse) {
    const loggedAdmin = await authApi.login(email, motDePasse)
    setAdmin(loggedAdmin)
  }

  async function logout() {
    await authApi.logout()
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, setAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}