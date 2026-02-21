import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import type { Order } from '../types'
import './OrderDetail.css'

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

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api
      .get<{ order: Order }>(ROUTES.orders.show(Number(id)))
      .then(({ data }) => setOrder(data.order))
      .catch(() => setError('Pedido no encontrado.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="order-detail-loading">Cargando…</p>
  if (error || !order) return <p className="order-detail-error">{error || 'Pedido no encontrado.'}</p>

  return (
    <div className="order-detail-page">
      <Link to="/orders" className="order-detail-back">← Volver a mis pedidos</Link>
      <h1>Pedido #{order.id}</h1>
      <p className="order-detail-status">Estado: <strong>{STATUS_LABEL[order.status] ?? order.status}</strong></p>
      <p className="order-detail-total">Total: ${(order.total / 1000).toFixed(0)}k</p>
      {order.requested_at && <p className="order-detail-date">Solicitado: {new Date(order.requested_at).toLocaleString()}</p>}
      {order.delivery_address && <p className="order-detail-address">Dirección: {order.delivery_address}</p>}
      <p className="order-detail-coords">Entrega: {order.delivery_latitude.toFixed(5)}, {order.delivery_longitude.toFixed(5)}</p>

      <section className="order-detail-items">
        <h2>Productos</h2>
        <ul className="order-items-list">
          {order.items.map((i) => (
            <li key={`${i.product_id}-${i.quantity}`} className="order-item-row">
              <span>{i.product_name} × {i.quantity}</span>
              <span className="order-item-price">${((i.unit_price * i.quantity) / 1000).toFixed(0)}k</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
