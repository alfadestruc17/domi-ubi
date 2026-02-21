import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import MapPicker from '../components/MapPicker'
import './RequestTrip.css'
import '../components/MapPicker.css'

const DEFAULT_CENTER: [number, number] = [4.711, -74.072] // Bogotá por si no hay geolocalización

export default function RequestTrip() {
  const navigate = useNavigate()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(true)
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null)
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null)
  const [mode, setMode] = useState<'origin' | 'destination'>('origin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getMyLocation = (onSuccess?: (lat: number, lng: number) => void) => {
    if (!navigator.geolocation) {
      setLocationLoading(false)
      toast.info('Tu navegador no soporta geolocalización. Elige el origen en el mapa.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserLocation({ lat, lng })
        setOrigin((prev) => prev ?? { lat, lng })
        setLocationLoading(false)
        onSuccess?.(lat, lng)
      },
      () => {
        setLocationLoading(false)
        if (!userLocation) toast.info('No se pudo obtener tu ubicación. Elige el origen en el mapa.')
        else toast.error('No se pudo actualizar la ubicación')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  useEffect(() => {
    getMyLocation()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- solo al montar

  const center = useMemo((): [number, number] => {
    if (mode === 'origin' && origin) return [origin.lat, origin.lng]
    if (mode === 'destination' && destination) return [destination.lat, destination.lng]
    if (userLocation) return [userLocation.lat, userLocation.lng]
    return DEFAULT_CENTER
  }, [mode, origin, destination, userLocation])

  const handleOriginClick = (lat: number, lng: number) => {
    setOrigin({ lat, lng })
  }

  const handleDestClick = (lat: number, lng: number) => {
    setDestination({ lat, lng })
  }

  const handleUseMyLocation = () => {
    setLocationLoading(true)
    getMyLocation((lat, lng) => {
      setOrigin({ lat, lng })
      setMode('origin')
      toast.success('Origen actualizado a tu ubicación')
      setLocationLoading(false)
    })
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
        <button
          type="button"
          className="request-trip-myloc"
          onClick={handleUseMyLocation}
          disabled={locationLoading}
          title="Centrar en mi ubicación y usar como origen"
        >
          {locationLoading ? 'Obteniendo…' : 'Mi ubicación'}
        </button>
      </div>

      <MapPicker
        origin={origin}
        destination={destination}
        onOriginClick={handleOriginClick}
        onDestClick={handleDestClick}
        mode={mode}
        center={center}
        userLocation={userLocation}
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
