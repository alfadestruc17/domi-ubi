import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { ROUTES } from '../config/api'
import { useAuth } from '../contexts/AuthContext'
import './MyStore.css'

interface StoreData {
  id: number
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  is_active: boolean
}

interface ProductData {
  id: number
  name: string
  description: string | null
  price: number
  is_active?: boolean
}

export default function MyStore() {
  const { profile } = useAuth()
  const [store, setStore] = useState<StoreData | null>(null)
  const [products, setProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editStore, setEditStore] = useState({ name: '', address: '', is_active: true })
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '' })
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [editProduct, setEditProduct] = useState({ name: '', description: '', price: '', is_active: true })

  const loadMyStore = () => {
    api
      .get<{ store: StoreData; products: ProductData[] }>(ROUTES.catalogManagement.myStore)
      .then(({ data }) => {
        setStore(data.store)
        setProducts(data.products ?? [])
        setEditStore({
          name: data.store.name,
          address: data.store.address ?? '',
          is_active: data.store.is_active,
        })
      })
      .catch((err: { response?: { data?: { error?: string } } }) => {
        setError(err.response?.data?.error ?? 'No tienes una tienda asignada.')
        setStore(null)
        setProducts([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadMyStore()
  }, [])

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return
    setSaving(true)
    try {
      await api.put(ROUTES.catalogManagement.updateStore(store.id), {
        name: editStore.name,
        address: editStore.address || null,
        is_active: editStore.is_active,
      })
      toast.success('Tienda actualizada')
      loadMyStore()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      toast.error(ax.response?.data?.error ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store || !newProduct.name.trim() || newProduct.price === '') return
    setSaving(true)
    try {
      const { data } = await api.post<{ product: ProductData }>(
        ROUTES.catalogManagement.addProduct(store.id),
        { name: newProduct.name.trim(), description: newProduct.description.trim() || null, price: Number(newProduct.price) }
      )
      toast.success('Producto creado')
      setProducts((prev) => [...prev, data.product])
      setNewProduct({ name: '', description: '', price: '' })
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      toast.error(ax.response?.data?.error ?? 'Error al crear producto')
    } finally {
      setSaving(false)
    }
  }

  const startEditProduct = (p: ProductData) => {
    setEditingProductId(p.id)
    setEditProduct({ name: p.name, description: p.description ?? '', price: String(p.price), is_active: p.is_active ?? true })
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store || editingProductId == null) return
    setSaving(true)
    try {
      await api.put(ROUTES.catalogManagement.updateProduct(store.id, editingProductId), {
        name: editProduct.name.trim(),
        description: editProduct.description.trim() || null,
        price: Number(editProduct.price),
        is_active: editProduct.is_active,
      })
      toast.success('Producto actualizado')
      setEditingProductId(null)
      loadMyStore()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      toast.error(ax.response?.data?.error ?? 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!store || !window.confirm('Eliminar este producto?')) return
    setSaving(true)
    try {
      await api.delete(ROUTES.catalogManagement.deleteProduct(store.id, productId))
      toast.success('Producto eliminado')
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      toast.error(ax.response?.data?.error ?? 'Error al eliminar')
    } finally {
      setSaving(false)
    }
  }

  if (profile?.role !== 'store') {
    return (
      <div className="my-store">
        <p className="my-store-error">Esta sección es solo para usuarios con rol Tienda.</p>
        <Link to="/" className="btn-secondary">Volver al inicio</Link>
      </div>
    )
  }

  if (loading) return <p className="my-store-loading">Cargando…</p>
  if (error || !store) {
    return (
      <div className="my-store">
        <p className="my-store-error">{error || 'No tienes una tienda asignada.'}</p>
        <Link to="/" className="btn-secondary">Volver al inicio</Link>
      </div>
    )
  }

  return (
    <div className="my-store">
      <h1 className="my-store-title">Mi tienda</h1>
      <section className="my-store-section card">
        <h2 className="my-store-section-title">Datos de la tienda</h2>
        <form onSubmit={handleSaveStore} className="my-store-form">
          <label>Nombre
            <input type="text" value={editStore.name} onChange={(e) => setEditStore((s) => ({ ...s, name: e.target.value }))} required />
          </label>
          <label>Dirección
            <input type="text" value={editStore.address} onChange={(e) => setEditStore((s) => ({ ...s, address: e.target.value }))} />
          </label>
          <label className="my-store-checkbox">
            <input type="checkbox" checked={editStore.is_active} onChange={(e) => setEditStore((s) => ({ ...s, is_active: e.target.checked }))} />
            Activa
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>Guardar tienda</button>
        </form>
      </section>
      <section className="my-store-section card">
        <h2 className="my-store-section-title">Agregar producto</h2>
        <form onSubmit={handleAddProduct} className="my-store-form">
          <label>Nombre
            <input type="text" value={newProduct.name} onChange={(e) => setNewProduct((s) => ({ ...s, name: e.target.value }))} required />
          </label>
          <label>Descripción
            <input type="text" value={newProduct.description} onChange={(e) => setNewProduct((s) => ({ ...s, description: e.target.value }))} />
          </label>
          <label>Precio
            <input type="number" step="0.01" min="0" value={newProduct.price} onChange={(e) => setNewProduct((s) => ({ ...s, price: e.target.value }))} required />
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>Crear producto</button>
        </form>
      </section>
      <section className="my-store-section card">
        <h2 className="my-store-section-title">Productos ({products.length})</h2>
        {products.length === 0 ? (
          <p className="my-store-muted">Aún no hay productos.</p>
        ) : (
          <ul className="my-store-product-list">
            {products.map((p) => (
              <li key={p.id} className="my-store-product-item">
                {editingProductId === p.id ? (
                  <form onSubmit={handleUpdateProduct} className="my-store-form-inline">
                    <input type="text" value={editProduct.name} onChange={(e) => setEditProduct((s) => ({ ...s, name: e.target.value }))} required />
                    <input type="text" value={editProduct.description} onChange={(e) => setEditProduct((s) => ({ ...s, description: e.target.value }))} placeholder="Descripción" />
                    <input type="number" step="0.01" min="0" value={editProduct.price} onChange={(e) => setEditProduct((s) => ({ ...s, price: e.target.value }))} />
                    <label className="my-store-checkbox">
                      <input type="checkbox" checked={editProduct.is_active} onChange={(e) => setEditProduct((s) => ({ ...s, is_active: e.target.checked }))} />
                      Activo
                    </label>
                    <button type="submit" className="btn-primary" disabled={saving}>Guardar</button>
                    <button type="button" className="btn-secondary" onClick={() => setEditingProductId(null)}>Cancelar</button>
                  </form>
                ) : (
                  <>
                    <div className="my-store-product-info">
                      <span className="my-store-product-name">{p.name}</span>
                      {p.description && <span className="my-store-product-desc">{p.description}</span>}
                      <span className="my-store-product-price">${Number(p.price).toFixed(2)}</span>
                    </div>
                    <div className="my-store-product-actions">
                      <button type="button" className="btn-secondary" onClick={() => startEditProduct(p)}>Editar</button>
                      <button type="button" className="my-store-btn-danger" onClick={() => handleDeleteProduct(p.id)} disabled={saving}>Eliminar</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
