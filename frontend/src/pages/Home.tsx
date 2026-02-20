import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import type { Trip } from '../types'
import './Home.css'

export default function Home() {
  const { profile } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<{ trips: Trip[] }>(ROUTES.trips.list)
      .then(({ data }) => setTrips(data.trips))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false))
  }, [])

  const isDriver = profile?.role === 'driver'

  return (
    <div className="home">
      <h1>Hola, {profile?.name ?? 'Usuario'}</h1>
      <p className="home-role">Rol: {isDriver ? 'Conductor' : 'Pasajero'}</p>

      {isDriver ? (
        <section className="home-section">
          <h2>Vista conductor</h2>
          <Link to="/driver" className="home-cta">Ir al panel de conductor</Link>
          <p className="home-hint">Activa disponibilidad y acepta viajes desde ahí.</p>
        </section>
      ) : (
        <section className="home-section">
          <h2>Solicitar viaje</h2>
          <Link to="/request-trip" className="home-cta">Pedir un viaje</Link>
        </section>
      )}

      <section className="home-section">
        <h2>Mis viajes</h2>
        {loading ? (
          <p>Cargando viajes…</p>
        ) : trips.length === 0 ? (
          <p className="home-empty">Aún no tienes viajes.</p>
        ) : (
          <ul className="trip-list">
            {trips.map((t) => (
              <li key={t.id}>
                <Link to={`/trip/${t.id}`}>
                  Viaje #{t.id} — {t.status}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
