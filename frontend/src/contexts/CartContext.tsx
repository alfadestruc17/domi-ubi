import { createContext, useCallback, useContext, useState } from 'react'

export interface CartItem {
  product_id: number
  product_name: string
  unit_price: number
  quantity: number
}

export interface CartStore {
  store_id: number
  store_name: string
  items: CartItem[]
}

interface CartContextValue {
  cart: CartStore | null
  addItem: (storeId: number, storeName: string, item: CartItem) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
  totalItems: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartStore | null>(null)

  const addItem = useCallback((storeId: number, storeName: string, item: CartItem) => {
    setCart((prev) => {
      if (prev && prev.store_id !== storeId) return prev
      const next: CartStore = prev
        ? { ...prev, store_name: storeName, items: [...prev.items] }
        : { store_id: storeId, store_name: storeName, items: [] }
      const idx = next.items.findIndex((i) => i.product_id === item.product_id)
      if (idx >= 0) {
        next.items[idx].quantity += item.quantity
      } else {
        next.items.push({ ...item })
      }
      return next
    })
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setCart((prev) => {
      if (!prev) return prev
      if (quantity < 1) return { ...prev, items: prev.items.filter((i) => i.product_id !== productId) }
      return {
        ...prev,
        items: prev.items.map((i) => (i.product_id === productId ? { ...i, quantity } : i)),
      }
    })
  }, [])

  const removeItem = useCallback((productId: number) => {
    setCart((prev) => {
      if (!prev) return prev
      const items = prev.items.filter((i) => i.product_id !== productId)
      return items.length ? { ...prev, items } : null
    })
  }, [])

  const clearCart = useCallback(() => setCart(null), [])

  const totalItems = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0

  const value: CartContextValue = {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
