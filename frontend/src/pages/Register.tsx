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
      const ax = err as { response?: { status?: number; data?: { error?: string; message?: unknown } } }
      let msg: string
      if (!ax.response) {
        msg = 'No se pudo conectar. ¿Está el backend en marcha? (docker-compose up -d y .\\scripts\\start-fresh.ps1)'
      } else if (ax.response.status === 500) {
        msg = 'Error del servidor (500). ¿Ejecutaste el setup? En la raíz: .\\scripts\\start-fresh.ps1'
      } else {
        const res = ax.response?.data
        msg = res?.error ?? (typeof res?.message === 'string' ? res.message : 'Error al registrarse')
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
