import { createContext, useContext, useState, useCallback } from 'react'
import { loadJSON, saveJSON } from './storage.js'

// Локальна "авторизація" для MVP: без сервера, без паролів на бекенді
// (бо бекенду немає). Дані користувача зберігаються лише в localStorage
// браузера. Архітектура (окремий контекст з login/register/logout)
// дозволяє пізніше підмінити реалізацію на реальний бекенд (JWT,
// cookie-сесії тощо), не чіпаючи компоненти, які використовують useAuth().

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadJSON('user', null))

  const register = useCallback((name, email) => {
    const newUser = { id: crypto.randomUUID(), name, email, createdAt: Date.now() }
    saveJSON('user', newUser)
    setUser(newUser)
    return newUser
  }, [])

  const login = useCallback((email) => {
    const existing = loadJSON('user', null)
    if (existing && existing.email === email) {
      setUser(existing)
      return existing
    }
    return null
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const updateProfile = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch }
      saveJSON('user', next)
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth повинен використовуватись всередині AuthProvider')
  return ctx
}
