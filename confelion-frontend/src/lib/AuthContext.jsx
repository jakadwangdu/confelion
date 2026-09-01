import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { fetchAPI } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || ''
  })
  const [loading, setLoading] = useState(true)

  const verifyToken = useCallback(async (authToken) => {
    if (!authToken) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const me = await fetchAPI('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (me && me.id) {
        setUser(me)
        localStorage.setItem('user', JSON.stringify(me))
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        setToken('')
      }
    } catch (e) {
      console.warn('Session verification note:', e.message)
      // Keep existing stored user if network issue, but if unauthorized clear
      if (e.message.includes('401') || e.message.includes('Invalid token')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        setToken('')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      verifyToken(storedToken)
    } else {
      setLoading(false)
    }
  }, [verifyToken])

  const signIn = async (email, password) => {
    try {
      const res = await fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      if (res.error) {
        return { data: null, error: { message: res.error } }
      }

      if (res.token && res.user) {
        setToken(res.token)
        setUser(res.user)
        localStorage.setItem('token', res.token)
        localStorage.setItem('user', JSON.stringify(res.user))
        return { data: { user: res.user, token: res.token }, error: null }
      }

      return { data: null, error: { message: 'Invalid response from server' } }
    } catch (e) {
      return { data: null, error: { message: e.message || 'Login failed' } }
    }
  }

  const signUp = async (email, password, name) => {
    try {
      const res = await fetchAPI('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      })

      if (res.error) {
        return { data: null, error: { message: res.error } }
      }

      if (res.token && res.user) {
        setToken(res.token)
        setUser(res.user)
        localStorage.setItem('token', res.token)
        localStorage.setItem('user', JSON.stringify(res.user))
        return { data: { user: res.user, token: res.token }, error: null }
      }

      return { data: null, error: { message: 'Invalid response from server' } }
    } catch (e) {
      return { data: null, error: { message: e.message || 'Signup failed' } }
    }
  }

  const signOut = async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken('')
    setUser(null)
  }

  const value = { user, token, loading, signIn, signUp, signOut }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    return {
      user: null,
      token: '',
      loading: false,
      signIn: async () => ({ error: { message: 'AuthContext not found' } }),
      signUp: async () => ({ error: { message: 'AuthContext not found' } }),
      signOut: async () => {}
    }
  }
  return context
}
