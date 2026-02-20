import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEcho } from '../config/echo'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import { useAuth } from '../contexts/AuthContext'
import type { Trip } from '../types'
import './TripView.css'

export default function TripView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const tripId = id ? parseInt(id, 10) : NaN
  const isDriver = profile?.role === 'driver'
  const canAccept = trip?.status === 'searching_driver' && isDriver
  const canStart = trip?.status === 'driver_assigned' && trip.driver_auth_user_id === profile?.auth_user_id
  const canComplete = trip?.status === 'in_progress' && trip.driver_auth_user_id === profile?.auth_user_id
  const canCancel = trip && ['requested', 'searching_driver', 'driver_assigned'].includes(trip.status)

  const fetchTrip = () => {
    if (!id || isNaN(tripId)) return
    api
      .get<{ trip: Trip }>(ROUTES.trips.show(tripId))
      .then(({ data }) => setTrip(data.trip))
      .catch(() => setError('Viaje no encontrado'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTrip()
  }, [id])

  useEffect(() => {
    if (!id || isNaN(tripId)) return
    const echo = getEcho()
    const channel = echo.channel(`trip.${id}`)
    channel.listen('.TripStatusChanged', (payload: { trip_id: number; status: string }) => {
      setTrip((prev) => (prev && prev.id === payload.trip_id ? { ...prev, status: payload.status } : prev))
      api.get<{ trip: Trip }>(ROUTES.trips.show(tripId)).then(({ data }) => setTrip(data.trip)).catch(() => {})
    })
    return () => {
      getEcho().leave(`trip.${id}`)
    }
  }, [id, tripId])

  const updateStatus = async (action: 'accept' | 'start' | 'complete' | 'cancel') => {
    if (!trip) return
    setActionLoading(true)
    setError('')
    try {
      const { data } = await api.put<{ trip: Trip }>(ROUTES.trips.status(trip.id), { action })
      setTrip(data.trip)
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setError(ax.response?.data?.error ?? 'Error al actualizar')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || !trip) {
    return (
      <div className="trip-view">
        {error ? <p className="trip-view-error">{error}</p> : <p>Cargando viaje…</p>}
        <button type="button" onClick={() => navigate('/')}>Volver</button>
      </div>
    )
  }

  return (
    <div className="trip-view">
      <h1>Viaje #{trip.id}</h1>
      <p className="trip-view-status">Estado: <strong>{trip.status}</strong></p>
      <p>Origen: {trip.origin.latitude.toFixed(4)}, {trip.origin.longitude.toFixed(4)}</p>
      <p>Destino: {trip.destination.latitude.toFixed(4)}, {trip.destination.longitude.toFixed(4)}</p>
      {error && <div className="trip-view-error">{error}</div>}
      <div className="trip-view-actions">
        {canAccept && <button type="button" disabled={actionLoading} onClick={() => updateStatus('accept')}>Aceptar viaje</button>}
        {canStart && <button type="button" disabled={actionLoading} onClick={() => updateStatus('start')}>Iniciar viaje</button>}
        {canComplete && <button type="button" disabled={actionLoading} onClick={() => updateStatus('complete')}>Completar viaje</button>}
        {canCancel && <button type="button" disabled={actionLoading} onClick={() => updateStatus('cancel')} className="trip-view-cancel">Cancelar</button>}
      </div>
      <button type="button" onClick={() => navigate('/')} className="trip-view-back">Volver al inicio</button>
    </div>
  )
}
