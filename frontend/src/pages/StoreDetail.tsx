import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import './StoreDetail.css'

interface StoreInfo {
  id: number
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
}

interface ProductItem {
  id: number
  name: string
  description: string | null
  price: number
}

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>()
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api
      .get<{ store: StoreInfo; products: ProductItem[] }>(ROUTES.catalog.store(Number(id)))
      .then(({ data }) => {
        setStore(data.store)
        setProducts(data.products)
      })
      .catch(() => setError('No se pudo cargar la tienda.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="store-detail-loading">Cargando…</p>
  if (error || !store) return <p className="store-detail-error">{error || 'Tienda no encontrada.'}</p>

  return (
    <div className="store-detail">
      <Link to="/stores" className="store-detail-back">← Volver a tiendas</Link>
      <h1>{store.name}</h1>
      {store.address && <p className="store-detail-address">{store.address}</p>}

      <section className="store-detail-products">
        <h2>Menú / Productos</h2>
        {products.length === 0 ? (
          <p className="store-detail-empty">Esta tienda aún no tiene productos.</p>
        ) : (
          <ul className="product-list">
            {products.map((p) => (
              <li key={p.id} className="product-item">
                <div className="product-info">
                  <span className="product-name">{p.name}</span>
                  {p.description && <span className="product-desc">{p.description}</span>}
                </div>
                <span className="product-price">
                  ${(p.price / 1000).toFixed(0)}k
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
