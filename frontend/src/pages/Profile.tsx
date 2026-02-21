import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import type { Profile as ProfileType } from '../types'
import './Profile.css'

const ROLE_LABEL: Record<string, string> = {
  customer: 'Cliente',
  driver: 'Conductor',
  store: 'Tienda',
}

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth()
  const [name, setName] = useState(profile?.name ?? user?.name ?? '')
  const [email, setEmail] = useState(profile?.email ?? user?.email ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [role, setRole] = useState<'customer' | 'driver' | 'store'>(profile?.role ?? 'customer')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setEmail(profile.email)
      setPhone(profile.phone ?? '')
      setRole(profile.role)
    } else if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [profile, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    try {
      await api.put<{ profile: ProfileType }>(ROUTES.users.profile, { name, email, phone, role })
      await refreshProfile()
      toast.success('Perfil guardado')
      setSaved(true)
    } catch {
      toast.error('No se pudo guardar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const displayName = name.trim() || user?.name || 'Usuario'
  const initial = (displayName.charAt(0) || 'U').toUpperCase()

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-avatar" aria-hidden>
          {initial}
        </div>
        <h1 className="profile-title">Mi perfil</h1>
        <p className="profile-subtitle">
          {ROLE_LABEL[role] ?? 'Cliente'} · Actualiza tus datos y rol
        </p>
      </header>

      <section className="profile-card card">
        <h2 className="profile-section-title">Datos personales</h2>
        <form onSubmit={handleSubmit} className="profile-form">
          <label className="profile-label">
            Nombre
            <input
              type="text"
              className="profile-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Tu nombre"
            />
          </label>
          <label className="profile-label">
            Correo electrónico
            <input
              type="email"
              className="profile-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="correo@ejemplo.com"
            />
          </label>
          <label className="profile-label">
            Teléfono
            <input
              type="text"
              className="profile-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Opcional"
            />
          </label>

          <div className="profile-divider" />

          <label className="profile-label">
            Rol en la aplicación
            <select
              className="profile-select"
              value={role}
              onChange={(e) => setRole(e.target.value as 'customer' | 'driver' | 'store')}
            >
              <option value="customer">Cliente (pedidos y viajes)</option>
              <option value="driver">Conductor (viajes y domicilios)</option>
              <option value="store">Tienda (catálogo y pedidos)</option>
            </select>
          </label>
          <p className="profile-hint">
            El rol define qué opciones ves: conductores acceden al panel de conductor; tiendas gestionan su tienda y productos.
          </p>
          {role === 'store' && (
            <div className="profile-info">
              Gestiona tu tienda y productos desde <Link to="/my-store">Mi tienda</Link>.
            </div>
          )}
          {role === 'driver' && (
            <div className="profile-info">
              Gestiona viajes y pedidos asignados desde el <Link to="/driver">Panel de conductor</Link>.
            </div>
          )}

          {saved && <p className="profile-saved">Perfil guardado correctamente.</p>}
          <button type="submit" className="btn-primary profile-submit" disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </section>
    </div>
  )
}
