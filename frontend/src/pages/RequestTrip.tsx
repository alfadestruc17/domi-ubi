import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import MapPicker from '../components/MapPicker'
import './RequestTrip.css'
import '../components/MapPicker.css'

const BOGOTA_CENTER: [number, number] = [4.711, -74.072]

export default function RequestTrip() {
  const navigate = useNavigate()
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>({ lat: 4.711, lng: -74.072 })
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>({ lat: 4.731, lng: -74.062 })
  const [mode, setMode] = useState<'origin' | 'destination'>('origin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const center = useMemo((): [number, number] => {
    if (mode === 'origin' && origin) return [origin.lat, origin.lng]
    if (mode === 'destination' && destination) return [destination.lat, destination.lng]
    return BOGOTA_CENTER
  }, [mode, origin, destination])

  const handleOriginClick = (lat: number, lng: number) => {
    setOrigin({ lat, lng })
  }

  const handleDestClick = (lat: number, lng: number) => {
    setDestination({ lat, lng })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !destination) {
      setError('Marca origen y destino en el mapa')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<{ trip: { id: number } }>(ROUTES.trips.create, {
        origin_latitude: origin.lat,
        origin_longitude: origin.lng,
        destination_latitude: destination.lat,
        destination_longitude: destination.lng,
      })
      toast.success('Viaje solicitado')
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
      <p className="request-trip-desc">Elige origen (A) y destino (B) en el mapa, luego confirma.</p>

      <div className="request-trip-mode">
        <button
          type="button"
          className={mode === 'origin' ? 'active' : ''}
          onClick={() => setMode('origin')}
        >
          Origen
        </button>
        <button
          type="button"
          className={mode === 'destination' ? 'active' : ''}
          onClick={() => setMode('destination')}
        >
          Destino
        </button>
      </div>

      <MapPicker
        origin={origin}
        destination={destination}
        onOriginClick={handleOriginClick}
        onDestClick={handleDestClick}
        mode={mode}
        center={center}
      />

      <form onSubmit={handleSubmit} className="request-trip-form">
        {error && <div className="request-trip-error">{error}</div>}
        {origin && (
          <p className="request-trip-coords">Origen: {origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}</p>
        )}
        {destination && (
          <p className="request-trip-coords">Destino: {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}</p>
        )}
        <button type="submit" disabled={loading || !origin || !destination}>
          {loading ? 'Solicitando…' : 'Pedir viaje'}
        </button>
      </form>
    </div>
  )
}
