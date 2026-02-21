import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import './Stores.css'

export interface StoreListItem {
  id: number
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
}

export default function Stores() {
  const [stores, setStores] = useState<StoreListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<{ stores: StoreListItem[] }>(ROUTES.catalog.stores)
      .then(({ data }) => setStores(data.stores))
      .catch(() => setError('No se pudieron cargar las tiendas.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="stores-page">
      <h1>Tiendas</h1>
      <p className="stores-desc">Elige una tienda para ver su menú y productos.</p>

      {loading && <p className="stores-loading">Cargando tiendas…</p>}
      {error && <p className="stores-error">{error}</p>}

      {!loading && !error && (
        <ul className="stores-list">
          {stores.length === 0 ? (
            <li className="stores-empty">No hay tiendas disponibles.</li>
          ) : (
            stores.map((store) => (
              <li key={store.id} className="stores-card">
                <Link to={`/stores/${store.id}`} className="stores-card-link">
                  <h2 className="stores-card-name">{store.name}</h2>
                  {store.address && <p className="stores-card-address">{store.address}</p>}
                  <span className="stores-card-cta">Ver menú →</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
