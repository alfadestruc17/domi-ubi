import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import { useAuth } from '../contexts/AuthContext'
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

const DRIVER_NEXT_STATUS: Record<string, string> = {
  ready_for_pickup: 'picked_up',
  picked_up: 'on_the_way',
  on_the_way: 'delivered',
}

const DRIVER_BUTTON_LABEL: Record<string, string> = {
  ready_for_pickup: 'Marcar recogido',
  picked_up: 'En camino',
  on_the_way: 'Marcar entregado',
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [error, setError] = useState('')

  const loadOrder = () => {
    if (!id) return
    api
      .get<{ order: Order }>(ROUTES.orders.show(Number(id)))
      .then(({ data }) => setOrder(data.order))
      .catch(() => setError('Pedido no encontrado.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    loadOrder()
  }, [id])

  const isDriverOfOrder = profile?.role === 'driver' && order?.driver_auth_user_id === profile?.auth_user_id
  const nextDriverStatus = order ? DRIVER_NEXT_STATUS[order.status] : null

  const updateStatus = async (newStatus: string) => {
    if (!id || !order) return
    setStatusLoading(true)
    try {
      await api.patch(ROUTES.orders.updateStatus(Number(id)), { status: newStatus })
      toast.success('Estado actualizado')
      loadOrder()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      toast.error(ax.response?.data?.error ?? 'Error al actualizar')
    } finally {
      setStatusLoading(false)
    }
  }

  if (loading) return <p className="order-detail-loading">Cargando…</p>
  if (error || !order) return <p className="order-detail-error">{error || 'Pedido no encontrado.'}</p>

  return (
    <div className="order-detail-page">
      <Link to={profile?.role === 'driver' ? '/driver' : '/orders'} className="order-detail-back">
        ← {profile?.role === 'driver' ? 'Panel conductor' : 'Mis pedidos'}
      </Link>
      <h1>Pedido #{order.id}</h1>
      <p className="order-detail-status">Estado: <strong>{STATUS_LABEL[order.status] ?? order.status}</strong></p>
      <p className="order-detail-total">Total: ${(order.total / 1000).toFixed(0)}k</p>
      {order.requested_at && <p className="order-detail-date">Solicitado: {new Date(order.requested_at).toLocaleString()}</p>}
      {order.delivery_address && <p className="order-detail-address">Dirección: {order.delivery_address}</p>}
      <p className="order-detail-coords">Entrega: {order.delivery_latitude.toFixed(5)}, {order.delivery_longitude.toFixed(5)}</p>

      {isDriverOfOrder && nextDriverStatus && (
        <div className="order-detail-driver-actions">
          <button
            type="button"
            className="btn-primary"
            disabled={statusLoading}
            onClick={() => updateStatus(nextDriverStatus)}
          >
            {DRIVER_BUTTON_LABEL[order.status] ?? 'Actualizar estado'}
          </button>
        </div>
      )}

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
