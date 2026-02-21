import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import type { Profile as ProfileType } from '../types'
import './Profile.css'

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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-page">
      <h1>Mi perfil</h1>
      <p className="profile-hint">Define tu rol: pasajero, conductor o tienda. Los conductores aceptan viajes; las tiendas gestionan su catálogo (próximamente).</p>
      <form onSubmit={handleSubmit} className="profile-form">
        <label>Nombre <input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>Correo <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Teléfono <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Opcional" /></label>
        <label>
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value as 'customer' | 'driver' | 'store')}>
            <option value="customer">Pasajero</option>
            <option value="driver">Conductor</option>
            <option value="store">Tienda</option>
          </select>
        </label>
        {role === 'store' && (
          <p className="profile-store-hint">En una próxima versión podrás gestionar tu tienda y productos desde aquí.</p>
        )}
        {saved && <p className="profile-saved">Perfil guardado.</p>}
        <button type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</button>
      </form>
    </div>
  )
}
