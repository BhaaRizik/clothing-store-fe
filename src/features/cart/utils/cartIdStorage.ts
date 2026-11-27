export const CART_ID_STORAGE_KEY = 'clothing-store.cartId'

// Fallback when localStorage is unavailable (blocked, private mode, quota): the cart lives for this page session.
let memoryCartId: string | null = null
let useMemory = false

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readCartId(): string | null {
  if (useMemory) return memoryCartId
  try {
    const value = storage()?.getItem(CART_ID_STORAGE_KEY)?.trim()
    return value ? value : null
  } catch {
    useMemory = true
    return memoryCartId
  }
}

export function writeCartId(cartId: string): void {
  memoryCartId = cartId
  try {
    const store = storage()
    if (!store) throw new Error('localStorage unavailable')
    store.setItem(CART_ID_STORAGE_KEY, cartId)
    useMemory = false
  } catch {
    useMemory = true
  }
}

export function clearCartId(): void {
  memoryCartId = null
  // Storage is retried on the next read.
  useMemory = false
  try {
    storage()?.removeItem(CART_ID_STORAGE_KEY)
  } catch {
    // Nothing persisted to remove.
  }
}
