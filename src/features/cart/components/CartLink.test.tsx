import { act, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CART_ID, makeCart, makeCartItem } from '@/test/cart'
import { renderRoute } from '@/test/renderRoute'
import { getCart } from '../api/cartApi'
import { cartIdStore } from '../hooks/cartIdStore'
import { writeCartId } from '../utils/cartIdStorage'
import { CartLink } from './CartLink'

vi.mock('../api/cartApi')

describe('CartLink', () => {
  it('links to the cart without a count when there is no cart', () => {
    renderRoute(<CartLink />)

    expect(screen.getByRole('link', { name: 'Cart' })).toHaveAttribute('href', '/cart')
    expect(getCart).not.toHaveBeenCalled()
  })

  it('shows the item count from the API in its accessible name', async () => {
    writeCartId(CART_ID)
    vi.mocked(getCart).mockResolvedValue(makeCart({ items: [makeCartItem({ quantity: 3 })], itemCount: 3 }))
    renderRoute(<CartLink />)

    const link = await screen.findByRole('link', { name: 'Cart, 3 items' })
    expect(link).toHaveTextContent('Cart3')
  })

  it('uses the singular for one item and hides a zero count', async () => {
    writeCartId(CART_ID)
    vi.mocked(getCart).mockResolvedValueOnce(makeCart({ itemCount: 1 }))
    renderRoute(<CartLink />)
    expect(await screen.findByRole('link', { name: 'Cart, 1 item' })).toBeInTheDocument()
  })

  it('hides the count for an empty cart', async () => {
    writeCartId(CART_ID)
    vi.mocked(getCart).mockResolvedValue(makeCart())
    renderRoute(<CartLink />)

    await vi.waitFor(() => expect(getCart).toHaveBeenCalled())
    expect(screen.getByRole('link', { name: 'Cart' })).toHaveTextContent(/^Cart$/)
  })

  it('updates when a cart id is stored later (first add)', async () => {
    vi.mocked(getCart).mockResolvedValue(makeCart({ itemCount: 2 }))
    renderRoute(<CartLink />)
    expect(screen.getByRole('link', { name: 'Cart' })).toBeInTheDocument()

    act(() => cartIdStore.set(CART_ID))

    expect(await screen.findByRole('link', { name: 'Cart, 2 items' })).toBeInTheDocument()
  })
})
