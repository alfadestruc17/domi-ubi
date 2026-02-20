import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import './Auth.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const emailParam = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [password_confirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setEmail(emailParam)
  }, [emailParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== password_confirmation) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (!token || !email) {
      setError('Falta el enlace válido. Solicita uno nuevo desde "¿Olvidaste tu contraseña?"')
      return
    }
    setLoading(true)
    try {
      await api.post(ROUTES.auth.resetPassword, {
        email,
        token,
        password,
        password_confirmation,
      })
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.')
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { error?: string } } }
      setError(ax.response?.data?.error ?? 'Error al restablecer. El enlace pudo haber expirado.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Contraseña actualizada</h1>
          <p className="auth-subtitle">Redirigiendo a iniciar sesión…</p>
          <p className="auth-footer">
            <Link to="/login">Ir a login</Link>
          </p>
        </div>
      </div>
    )
  }

  if (!token && !emailParam) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Enlace inválido</h1>
          <p className="auth-subtitle">Usa el enlace que te enviamos por correo. Si ha expirado, solicita uno nuevo.</p>
          <p className="auth-footer">
            <Link to="/forgot-password">Solicitar nuevo enlace</Link> · <Link to="/login">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Nueva contraseña</h1>
        <p className="auth-subtitle">Indica tu nueva contraseña (mínimo 8 caracteres).</p>
        <form onSubmit={handleSubmit}>
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
            Nueva contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          <label>
            Confirmar contraseña
            <input
              type="password"
              value={password_confirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              autoComplete="new-password"
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Guardando…' : 'Restablecer contraseña'}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
