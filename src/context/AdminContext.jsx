import { createContext, useContext, useState, useEffect } from 'react'

const AdminContext = createContext(null)

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'tempest2024'
const SESSION_KEY = 'tempest_admin_authed'

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === '1' } catch { return false }
  })

  const login = (pw) => {
    if (pw === ADMIN_PASSWORD) {
      setIsAdmin(true)
      try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}
      return true
    }
    return false
  }

  const logout = () => {
    setIsAdmin(false)
    try { sessionStorage.removeItem(SESSION_KEY) } catch {}
  }

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
