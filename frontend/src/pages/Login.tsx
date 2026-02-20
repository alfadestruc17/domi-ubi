import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const state = location.state as { message?: string } | null
    if (state?.message) {
      setSuccessMessage(state.message)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Bienvenido')
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string }
      let msg: string
      if (!ax.response) {
        msg = 'No se pudo conectar. ¿Está el backend en marcha? (docker-compose up -d y luego .\\scripts\\start-fresh.ps1)'
      } else if (ax.response.status === 500) {
        msg = 'Error del servidor (500). ¿Ejecutaste el setup? En la raíz del proyecto: .\\scripts\\start-fresh.ps1'
      } else {
        msg = ax.response?.data?.error ?? ax.response?.data?.message ?? 'Error al iniciar sesión'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Domi-Ubi</h1>
        <p className="auth-subtitle">Iniciar sesión</p>
        <form onSubmit={handleSubmit}>
          {successMessage && <div className="auth-success">{successMessage}</div>}
          {error && <div className="auth-error">{error}</div>}
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <p className="auth-forgot">
            <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          </p>
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}
