import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post(ROUTES.auth.forgotPassword, { email })
      setSent(true)
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string } } }
      if (!ax.response) {
        setError('No se pudo conectar. ¿Está el backend en marcha?')
      } else {
        setError(ax.response?.data?.message ?? 'Error al enviar. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Revisa tu correo</h1>
          <p className="auth-subtitle">
            Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para restablecer tu contraseña.
            Revisa también la carpeta de spam.
          </p>
          <p className="auth-footer">
            <Link to="/login">Volver a iniciar sesión</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>¿Olvidaste tu contraseña?</h1>
        <p className="auth-subtitle">Indica tu correo y te enviaremos un enlace para restablecerla.</p>
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
              placeholder="tu@correo.com"
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
