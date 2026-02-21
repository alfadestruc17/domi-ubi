import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import type { Trip } from '../types'
import './MyTrips.css'

export default function MyTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<{ trips: Trip[] }>(ROUTES.trips.list)
      .then(({ data }) => setTrips(data.trips ?? []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="my-trips">
      <h1 className="my-trips-title">Mis viajes</h1>
      {loading ? (
        <p className="my-trips-muted">Cargando…</p>
      ) : trips.length === 0 ? (
        <p className="my-trips-muted">Aún no tienes viajes.</p>
      ) : (
        <ul className="my-trips-list">
          {trips.map((t) => (
            <li key={t.id}>
              <Link to={`/trip/${t.id}`} className="my-trips-card card">
                <span className="my-trips-id">Viaje #{t.id}</span>
                <span className="my-trips-status" data-status={t.status}>{t.status}</span>
                {t.requested_at && (
                  <span className="my-trips-date">{new Date(t.requested_at).toLocaleDateString()}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
