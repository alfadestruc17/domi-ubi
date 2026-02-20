import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password_confirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== password_confirmation) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await register(name, email, password, password_confirmation)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; message?: unknown } } }
      const msg = ax.response?.data?.error ?? (typeof ax.response?.data?.message === 'string' ? ax.response.data.message : 'Error al registrarse')
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Domi-Ubi</h1>
        <p className="auth-subtitle">Crear cuenta</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <label>Nombre <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></label>
          <label>Correo <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
          <label>Contraseña <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></label>
          <label>Confirmar contraseña <input type="password" value={password_confirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required /></label>
          <button type="submit" disabled={loading}>{loading ? 'Creando…' : 'Registrarme'}</button>
        </form>
        <p className="auth-footer">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </div>
    </div>
  )
}
