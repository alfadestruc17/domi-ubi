import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import { useCart } from '../contexts/CartContext'
import './Cart.css'

export default function Cart() {
  const { cart, clearCart, updateQuantity, removeItem } = useCart()
  const navigate = useNavigate()
  const [deliveryLat, setDeliveryLat] = useState<number | ''>('')
  const [deliveryLng, setDeliveryLng] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeliveryLat(Number(pos.coords.latitude.toFixed(6)))
        setDeliveryLng(Number(pos.coords.longitude.toFixed(6)))
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart || cart.items.length === 0) {
      setError('Añade productos al carrito desde una tienda.')
      return
    }
    const lat = Number(deliveryLat)
    const lng = Number(deliveryLng)
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Indica una ubicación de entrega válida (latitud y longitud).')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<{ order: { id: number } }>(ROUTES.orders.create, {
        store_id: cart.store_id,
        delivery_latitude: lat,
        delivery_longitude: lng,
        items: cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      })
      clearCart()
      toast.success('Pedido realizado')
      navigate(`/orders/${data.order.id}`, { replace: true })
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setError(ax.response?.data?.error ?? 'Error al crear el pedido.')
    } finally {
      setLoading(false)
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <h1>Carrito</h1>
        <p className="cart-empty">Tu carrito está vacío. <Link to="/stores">Elige una tienda</Link> y añade productos.</p>
      </div>
    )
  }

  const total = cart.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)

  return (
    <div className="cart-page">
      <h1>Carrito</h1>
      <p className="cart-store">Tienda: {cart.store_name}</p>
      <ul className="cart-list">
        {cart.items.map((i) => (
          <li key={i.product_id} className="cart-item">
            <span className="cart-item-name">{i.product_name}</span>
            <div className="cart-item-qty">
              <input
                type="number"
                min={1}
                value={i.quantity}
                onChange={(e) => updateQuantity(i.product_id, Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <button type="button" onClick={() => removeItem(i.product_id)} className="cart-remove">Quitar</button>
            </div>
            <span className="cart-item-price">${((i.unit_price * i.quantity) / 1000).toFixed(0)}k</span>
          </li>
        ))}
      </ul>
      <p className="cart-total">Total: ${(total / 1000).toFixed(0)}k</p>
      <form onSubmit={handleConfirm} className="cart-form">
        <h2>Ubicación de entrega</h2>
        <p className="cart-form-hint">Se usa tu ubicación por defecto si está disponible.</p>
        <label>Latitud <input type="number" step="any" value={deliveryLat} onChange={(e) => setDeliveryLat(e.target.value === '' ? '' : Number(e.target.value))} required /></label>
        <label>Longitud <input type="number" step="any" value={deliveryLng} onChange={(e) => setDeliveryLng(e.target.value === '' ? '' : Number(e.target.value))} required /></label>
        {error && <p className="cart-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Enviando…' : 'Confirmar pedido'}</button>
      </form>
    </div>
  )
}
