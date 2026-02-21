import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import type { Trip } from '../types'
import type { Order } from '../types'
import './Home.css'

const ROLE_LABEL: Record<string, string> = {
  customer: 'Cliente',
  driver: 'Conductor',
  store: 'Tienda',
}

export default function Home() {
  const { profile } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<{ trips: Trip[] }>(ROUTES.trips.list).then(({ data }) => data.trips).catch(() => []),
      api.get<{ orders: Order[] }>(ROUTES.orders.list).then(({ data }) => data.orders).catch(() => []),
    ]).then(([t, o]) => {
      setTrips(t)
      setOrders(o)
    }).finally(() => setLoading(false))
  }, [])

  const isDriver = profile?.role === 'driver'
  const isStore = profile?.role === 'store'
  const displayName = profile?.name ?? 'Usuario'

  return (
    <div className="home">
      <section className="home-welcome">
        <h1 className="home-title">Hola, {displayName.split(' ')[0]} 👋</h1>
        <p className="home-role">{ROLE_LABEL[profile?.role ?? 'customer'] ?? 'Cliente'}</p>
      </section>

      <section className="home-cta-section">
        <div className="home-cta-card card">
          <div className="home-cta-content">
            <h2 className="home-cta-title">¿Qué necesitas?</h2>
            <p className="home-cta-desc">
              {isDriver ? 'Gestiona tus viajes y pedidos asignados' : isStore ? 'Gestiona tu tienda y pedidos' : 'Pide domicilio o solicita un viaje'}
            </p>
            <div className="home-cta-buttons">
              {!isDriver && !isStore && (
                <>
                  <Link to="/stores" className="btn-primary home-cta-btn">Pedir domicilio</Link>
                  <Link to="/request-trip" className="btn-secondary home-cta-btn">Solicitar viaje</Link>
                </>
              )}
              {isDriver && <Link to="/driver" className="btn-primary home-cta-btn">Panel de conductor</Link>}
              {isStore && <Link to="/my-store" className="btn-primary home-cta-btn">Mi tienda</Link>}
            </div>
          </div>
        </div>
      </section>

      <section className="home-activity">
        <h2 className="home-section-title">Actividad reciente</h2>
        {orders.length > 0 && (
          <div className="home-block">
            <h3 className="home-block-title">Mis pedidos</h3>
            <ul className="home-list">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link to={`/orders/${o.id}`} className="home-list-card card">
                    <span className="home-list-id">Pedido #{o.id}</span>
                    <span className="home-list-status" data-status={o.status}>{o.status}</span>
                    <span className="home-list-meta">${(o.total / 1000).toFixed(0)}k</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="home-block">
          <h3 className="home-block-title">Mis viajes</h3>
          {loading ? <p className="home-muted">Cargando…</p> : trips.length === 0 ? <p className="home-muted">Aún no tienes viajes.</p> : (
            <ul className="home-list">
              {trips.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <Link to={`/trip/${t.id}`} className="home-list-card card">
                    <span className="home-list-id">Viaje #{t.id}</span>
                    <span className="home-list-status" data-status={t.status}>{t.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
