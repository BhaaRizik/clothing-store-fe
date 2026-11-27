import { afterEach, describe, expect, it, vi } from 'vitest'
import { CART_ID_STORAGE_KEY, clearCartId, readCartId, writeCartId } from './cartIdStorage'

const blockStorage = () => {
  const blocked = () => {
    throw new DOMException('The operation is insecure.', 'SecurityError')
  }
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked)
}

describe('cartIdStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    clearCartId()
  })

  it('reads, writes and clears the cart id in localStorage', () => {
    expect(readCartId()).toBeNull()

    writeCartId('cart-1')
    expect(localStorage.getItem(CART_ID_STORAGE_KEY)).toBe('cart-1')
    expect(readCartId()).toBe('cart-1')

    clearCartId()
    expect(localStorage.getItem(CART_ID_STORAGE_KEY)).toBeNull()
    expect(readCartId()).toBeNull()
  })

  it('uses the key clothing-store.cartId and ignores blank values', () => {
    expect(CART_ID_STORAGE_KEY).toBe('clothing-store.cartId')
    localStorage.setItem(CART_ID_STORAGE_KEY, '   ')
    expect(readCartId()).toBeNull()
  })

  it('falls back to memory when storage throws', () => {
    blockStorage()

    expect(readCartId()).toBeNull()
    expect(() => writeCartId('cart-1')).not.toThrow()
    expect(readCartId()).toBe('cart-1')
    expect(() => clearCartId()).not.toThrow()
    expect(readCartId()).toBeNull()
  })

  it('keeps the id in memory when only writing fails (e.g. quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })

    writeCartId('cart-1')

    expect(readCartId()).toBe('cart-1')
  })
})
