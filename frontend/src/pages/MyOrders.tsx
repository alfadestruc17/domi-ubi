import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import type { Order } from '../types'
import './MyOrders.css'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready_for_pickup: 'Listo para recoger',
  assigned: 'Repartidor asignado',
  picked_up: 'Recogido',
  on_the_way: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ orders: Order[] }>(ROUTES.orders.list).then(({ data }) => setOrders(data.orders)).catch(() => setOrders([])).finally(() => setLoading(false))
  }, [])

  return (
    <div className="my-orders-page">
      <h1>Mis pedidos</h1>
      {loading && <p className="my-orders-loading">Cargando…</p>}
      {!loading && orders.length === 0 && (
        <p className="my-orders-empty">Aún no tienes pedidos. <Link to="/stores">Elige una tienda</Link> y haz tu primer pedido.</p>
      )}
      {!loading && orders.length > 0 && (
        <ul className="orders-list">
          {orders.map((o) => (
            <li key={o.id} className="orders-card">
              <Link to={`/orders/${o.id}`} className="orders-card-link">
                <span className="orders-id">Pedido #{o.id}</span>
                <span className="orders-status">{STATUS_LABEL[o.status] ?? o.status}</span>
                <span className="orders-total">${(o.total / 1000).toFixed(0)}k</span>
                {o.requested_at && <span className="orders-date">{new Date(o.requested_at).toLocaleDateString()}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
