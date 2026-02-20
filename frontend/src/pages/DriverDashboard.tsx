import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import { getEcho } from '../config/echo'
import type { Trip } from '../types'
import type { DriverPresence } from '../types'
import './DriverDashboard.css'

const BOGOTA = { lat: 4.711, lng: -74.072 }

export default function DriverDashboard() {
  const [available, setAvailable] = useState(false)
  const [lat, setLat] = useState(BOGOTA.lat)
  const [lng, setLng] = useState(BOGOTA.lng)
  const [trips, setTrips] = useState<Trip[]>([])
  const [drivers, setDrivers] = useState<DriverPresence[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadTrips = () => {
    api.get<{ trips: Trip[] }>(ROUTES.trips.available).then(({ data }) => {
      setTrips(data.trips ?? [])
    }).catch(() => setTrips([]))
  }

  const loadDrivers = () => {
    api.get<{ drivers: DriverPresence[] }>(ROUTES.drivers.available).then(({ data }) => {
      setDrivers(data.drivers ?? [])
    }).catch(() => setDrivers([]))
  }

  useEffect(() => {
    api.get(ROUTES.drivers.me).then(({ data }) => {
      const d = data.driver ?? data
      setAvailable(!!d?.is_available)
      if (d?.latitude != null) setLat(Number(d.latitude))
      if (d?.longitude != null) setLng(Number(d.longitude))
    }).catch(() => {})
    loadTrips()
    loadDrivers()
  }, [])

  useEffect(() => {
    const echo = getEcho()
    const ch = echo.channel('drivers')
    ch.listen('.DriverLocationUpdated', () => loadDrivers())
    ch.listen('.DriverAvailabilityChanged', () => loadDrivers())
    return () => { echo.leave('drivers') }
  }, [])

  const toggleAvailability = async () => {
    setLoading(true)
    setError('')
    try {
      await api.put(ROUTES.drivers.availability, {
        available: !available,
        latitude: lat,
        longitude: lng,
      })
      setAvailable(!available)
      toast.success(!available ? 'En línea' : 'Desconectado')
      loadTrips()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setError(ax.response?.data?.error ?? 'Error')
    } finally {
      setLoading(false)
    }
  }

  const updateLocation = async () => {
    setLoading(true)
    setError('')
    try {
      await api.put(ROUTES.drivers.location, { latitude: lat, longitude: lng })
      toast.success('Ubicación actualizada')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setError(ax.response?.data?.error ?? 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="driver-dash">
      <h1>Panel conductor</h1>
      {error && <div className="driver-dash-error">{error}</div>}
      <section className="driver-dash-section">
        <h2>Disponibilidad</h2>
        <p>Estado: <strong>{available ? 'En línea' : 'Desconectado'}</strong></p>
        <button type="button" onClick={toggleAvailability} disabled={loading}>
          {available ? 'Pasar a desconectado' : 'Pasar a en línea'}
        </button>
      </section>
      <section className="driver-dash-section">
        <h2>Ubicación</h2>
        <label>Lat <input type="number" step="any" value={lat} onChange={(e) => setLat(Number(e.target.value))} /></label>
        <label>Lng <input type="number" step="any" value={lng} onChange={(e) => setLng(Number(e.target.value))} /></label>
        <button type="button" onClick={updateLocation} disabled={loading}>Actualizar ubicación</button>
      </section>
      <section className="driver-dash-section">
        <h2>Viajes buscando conductor</h2>
        {trips.length === 0 ? <p className="driver-dash-empty">Ninguno por ahora.</p> : (
          <ul className="driver-dash-trips">
            {trips.map((t) => (
              <li key={t.id}>
                <Link to={`/trip/${t.id}`}>Viaje #{t.id} — Aceptar</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="driver-dash-section">
        <h2>Conductores en línea</h2>
        <p>{drivers.length} conductor(es) disponible(s).</p>
      </section>
    </div>
  )
}
