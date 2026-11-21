import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ils } from '@/test/fixtures'
import { makeProduct } from '@/test/products'
import { renderRoute } from '@/test/renderRoute'
import type { ProductCardResponse } from '../types/product'
import { ProductCard } from './ProductCard'

const renderCard = (product: ProductCardResponse) => renderRoute(<ProductCard product={product} />)

describe('ProductCard', () => {
  it('shows the primary image, name and price', () => {
    renderCard(makeProduct())

    const image = screen.getByRole('img', { name: 'White linen shirt, front view' })
    expect(image).toHaveAttribute('src', 'https://cdn.example.com/linen.jpg')
    expect(screen.getByRole('heading', { name: 'Linen Shirt' })).toBeInTheDocument()
    expect(screen.getByText('₪149.90')).toBeVisible()
    expect(screen.queryByText(/sale price/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/original price/i)).not.toBeInTheDocument()
  })

  it.each([
    ['empty', ''],
    ['whitespace-only', '   '],
    ['null', null],
  ])('uses the product name as alt text when the API alt is %s', (_label, alt) => {
    renderCard(makeProduct({ primaryImage: { url: 'https://cdn.example.com/x.jpg', alt } }))
    expect(screen.getByRole('img', { name: 'Linen Shirt' })).toHaveAttribute('src', 'https://cdn.example.com/x.jpg')
  })

  it('shows a fallback when the product has no image', () => {
    renderCard(makeProduct({ primaryImage: null }))
    expect(screen.getByRole('img', { name: 'No image available for Linen Shirt' })).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(1)
  })

  it('shows a fallback when the image url is null', () => {
    renderCard(makeProduct({ primaryImage: { url: null, alt: 'Linen shirt' } }))
    expect(screen.getByRole('img', { name: 'No image available for Linen Shirt' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Linen shirt' })).not.toBeInTheDocument()
  })

  it('shows a fallback when the image fails to load', () => {
    renderCard(makeProduct())
    fireEvent.error(screen.getByRole('img', { name: 'White linen shirt, front view' }))

    expect(screen.getByRole('img', { name: 'No image available for Linen Shirt' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'White linen shirt, front view' })).not.toBeInTheDocument()
  })

  it('shows the sale price next to the base price, labelled for screen readers', () => {
    renderCard(makeProduct({ salePrice: ils('99.90') }))

    expect(screen.getByText('Sale price:')).toBeInTheDocument()
    expect(screen.getByText('₪99.90')).toBeVisible()
    expect(screen.getByText('Original price:')).toBeInTheDocument()
    expect(screen.getByText('₪149.90')).toBeVisible()
  })

  it('shows "Price unavailable" instead of crashing when the price is null', () => {
    renderCard(makeProduct({ price: null, salePrice: ils('99.90') }))

    expect(screen.getByText('Price unavailable')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Linen Shirt' })).toBeInTheDocument()
    expect(screen.queryByText(/null/)).not.toBeInTheDocument()
  })

  it('is a keyboard-accessible link to the product details page', async () => {
    const { user } = renderCard(makeProduct())

    const link = screen.getByRole('link', { name: 'Linen Shirt' })
    expect(link).toHaveAttribute('href', '/products/linen-shirt')

    await user.tab()
    expect(link).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('location')).toHaveTextContent('/products/linen-shirt')
  })
})
