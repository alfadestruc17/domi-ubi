import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import type { User, Profile } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  profile: Profile | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem('token'),
    user: null,
    profile: null,
    loading: true,
  })

  const refreshProfile = useCallback(async () => {
    const t = localStorage.getItem('token')
    if (!t) {
      setState((s) => ({ ...s, profile: null, loading: false }))
      return
    }
    try {
      const { data } = await api.get<{ profile: Profile | null }>(ROUTES.users.profile)
      setState((s) => ({ ...s, profile: data.profile ?? null }))
    } catch {
      setState((s) => ({ ...s, profile: null }))
    }
  }, [])

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) {
      setState((s) => ({ ...s, loading: false }))
      return
    }
    api
      .post<{ user: User }>(ROUTES.auth.validateToken, {})
      .then(({ data }) => {
        setState((s) => ({ ...s, user: data.user }))
        return refreshProfile()
      })
      .catch(() => {
        localStorage.removeItem('token')
        setState((s) => ({ ...s, token: null, user: null, profile: null }))
      })
      .finally(() => setState((s) => ({ ...s, loading: false })))
  }, [refreshProfile])

  useEffect(() => {
    const onLogout = () => setState((s) => ({ ...s, token: null, user: null, profile: null }))
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>(ROUTES.auth.login, { email, password })
    localStorage.setItem('token', data.token)
    setState((s) => ({ ...s, token: data.token, user: data.user }))
    await refreshProfile()
  }, [refreshProfile])

  const register = useCallback(
    async (name: string, email: string, password: string, password_confirmation: string) => {
      const { data } = await api.post<{ token: string; user: User }>(ROUTES.auth.register, {
        name,
        email,
        password,
        password_confirmation,
      })
      localStorage.setItem('token', data.token)
      setState((s) => ({ ...s, token: data.token, user: data.user }))
      await refreshProfile()
    },
    [refreshProfile]
  )

  const logout = useCallback(() => {
    const t = localStorage.getItem('token')
    if (t) api.post(ROUTES.auth.logout, {}).catch(() => {})
    localStorage.removeItem('token')
    setState({ token: null, user: null, profile: null, loading: false })
  }, [])

  const value: AuthContextValue = { ...state, login, register, logout, refreshProfile }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
