import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import './RequestTrip.css'

const BOGOTA_CENTER = { lat: 4.711, lng: -74.072 }

export default function RequestTrip() {
  const navigate = useNavigate()
  const [originLat, setOriginLat] = useState(String(BOGOTA_CENTER.lat))
  const [originLng, setOriginLng] = useState(String(BOGOTA_CENTER.lng))
  const [destLat, setDestLat] = useState(String(BOGOTA_CENTER.lat + 0.02))
  const [destLng, setDestLng] = useState(String(BOGOTA_CENTER.lng + 0.01))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<{ trip: { id: number } }>(ROUTES.trips.create, {
        origin_latitude: parseFloat(originLat),
        origin_longitude: parseFloat(originLng),
        destination_latitude: parseFloat(destLat),
        destination_longitude: parseFloat(destLng),
      })
      navigate(`/trip/${data.trip.id}`, { replace: true })
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; message?: string } } }
      setError(ax.response?.data?.error ?? ax.response?.data?.message ?? 'Error al solicitar viaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="request-trip">
      <h1>Solicitar viaje</h1>
      <p className="request-trip-desc">Indica origen y destino (coordenadas). En un MVP real aquí iría un mapa.</p>
      <form onSubmit={handleSubmit} className="request-trip-form">
        {error && <div className="request-trip-error">{error}</div>}
        <fieldset>
          <legend>Origen</legend>
          <label>Lat <input type="number" step="any" value={originLat} onChange={(e) => setOriginLat(e.target.value)} required /></label>
          <label>Lng <input type="number" step="any" value={originLng} onChange={(e) => setOriginLng(e.target.value)} required /></label>
        </fieldset>
        <fieldset>
          <legend>Destino</legend>
          <label>Lat <input type="number" step="any" value={destLat} onChange={(e) => setDestLat(e.target.value)} required /></label>
          <label>Lng <input type="number" step="any" value={destLng} onChange={(e) => setDestLng(e.target.value)} required /></label>
        </fieldset>
        <button type="submit" disabled={loading}>
          {loading ? 'Solicitando…' : 'Pedir viaje'}
        </button>
      </form>
    </div>
  )
}
