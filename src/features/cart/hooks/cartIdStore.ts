import { useSyncExternalStore } from 'react'
import { CART_ID_STORAGE_KEY, clearCartId, readCartId, writeCartId } from '../utils/cartIdStorage'

const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab created or dropped the cart.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CART_ID_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** The current cart id, shared reactively by every component (e.g. the header count after the first add). */
export const cartIdStore = {
  get: readCartId,
  set(cartId: string) {
    if (readCartId() === cartId) return
    writeCartId(cartId)
    notify()
  },
  /** Clears the id; with `expected`, only if it is still the stored one (another tab may have replaced it). */
  clear(expected?: string) {
    const current = readCartId()
    if (current === null || (expected !== undefined && current !== expected)) return
    clearCartId()
    notify()
  },
}

export function useCartId(): string | null {
  return useSyncExternalStore(subscribe, readCartId, () => null)
}
