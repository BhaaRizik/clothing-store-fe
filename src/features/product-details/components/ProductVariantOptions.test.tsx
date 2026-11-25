import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { describe, expect, it } from 'vitest'
import { theme } from '@/shared/theme/theme'
import { variant } from '@/test/variants'
import { useVariantSelection } from '../hooks/useVariantSelection'
import type { ProductVariant } from '../types/productDetails'
import { ProductVariantOptions } from './ProductVariantOptions'

/** The selection is owned by the parent in the app; this harness plays that role. */
function Harness({ variants }: { variants: ProductVariant[] }) {
  return <ProductVariantOptions selection={useVariantSelection(variants)} />
}

function renderOptions(variants: ProductVariant[]) {
  const user = userEvent.setup()
  render(
    <ThemeProvider theme={theme}>
      <Harness variants={variants} />
    </ThemeProvider>,
  )
  return { user }
}

const status = () => screen.getByRole('status')

const shirt = [
  variant('v1', 'Navy', 'S'),
  variant('v2', 'Navy', 'M', false),
  variant('v3', 'White', 'M'),
  variant('v4', 'Mystery Grey', 'L', false),
]

describe('ProductVariantOptions', () => {
  it('renders color and size radio groups and asks for both selections', () => {
    renderOptions(shirt)

    expect(screen.getByRole('group', { name: 'Color' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Size' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(6)
    expect(status()).toHaveTextContent('Select a color and size')
    expect(status()).toHaveAttribute('aria-live', 'polite')
  })

  it('shows the selected color in the legend and the availability of the exact combination', async () => {
    const { user } = renderOptions(shirt)

    await user.click(screen.getByRole('radio', { name: 'Navy' }))
    expect(screen.getByRole('group', { name: 'Color: Navy' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Navy' })).toBeChecked()
    expect(status()).toHaveTextContent('Select a size')

    await user.click(screen.getByRole('radio', { name: 'S' }))
    expect(status()).toHaveTextContent('In stock')

    await user.click(screen.getByRole('radio', { name: 'M (out of stock)' }))
    expect(screen.getByRole('radio', { name: 'M (out of stock)' })).toBeChecked()
    expect(status()).toHaveTextContent('Out of stock')
  })

  it('asks for a color when only the size is chosen', async () => {
    const { user } = renderOptions(shirt)

    await user.click(screen.getByRole('radio', { name: 'S' }))

    expect(status()).toHaveTextContent('Select a color')
  })

  it('disables sizes not defined for the selected color and clears an invalid size on color change', async () => {
    const { user } = renderOptions(shirt)
    await user.click(screen.getByRole('radio', { name: 'Navy' }))
    await user.click(screen.getByRole('radio', { name: 'S' }))

    await user.click(screen.getByRole('radio', { name: 'White' }))

    expect(screen.getByRole('radio', { name: 'S' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'S' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'M' })).toBeEnabled()
    expect(status()).toHaveTextContent('Select a size')
  })

  it('labels out-of-stock options in their accessible name', () => {
    renderOptions(shirt)

    expect(screen.getByRole('radio', { name: 'Mystery Grey (out of stock)' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'L (out of stock)' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'Navy' })).toBeInTheDocument()
  })

  it('supports keyboard selection with arrow keys', async () => {
    const { user } = renderOptions(shirt)

    await user.tab()
    expect(screen.getByRole('radio', { name: 'Navy' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('radio', { name: 'White' })).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'White' })).toBeChecked()
    expect(screen.getByRole('group', { name: 'Color: White' })).toBeInTheDocument()
  })

  it('renders only the size group for a size-only product', () => {
    renderOptions([variant('v1', null, 'S'), variant('v2', null, 'M')])

    expect(screen.queryByRole('group', { name: /color/i })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Size' })).toBeInTheDocument()
    expect(status()).toHaveTextContent('Select a size')
  })

  it('renders only the color group for a color-only product', () => {
    renderOptions([variant('v1', 'Navy', null), variant('v2', 'Red', null)])

    expect(screen.queryByRole('group', { name: /size/i })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Color' })).toBeInTheDocument()
    expect(status()).toHaveTextContent('Select a color')
  })

  it('shows no selectors and "In stock" for a single variant without dimensions', () => {
    renderOptions([variant('v1', null, null)])

    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(status()).toHaveTextContent('In stock')
  })

  it('preselects a single-variant product', () => {
    renderOptions([variant('v1', 'Navy', 'One size', false)])

    expect(screen.getByRole('radio', { name: 'Navy (out of stock)' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'One size (out of stock)' })).toBeChecked()
    expect(status()).toHaveTextContent('Out of stock')
  })

  it('uses the hex code as the swatch color and a neutral fallback for a missing or unsafe value', () => {
    renderOptions([
      variant('v1', 'Navy', 'S'),
      { id: 'v2', size: 'S', color: { name: 'Sand', hexCode: null }, available: true },
      { id: 'v3', size: 'S', color: { name: 'Evil', hexCode: 'red;background:url(x)' }, available: true },
    ])

    const swatchOf = (name: string) => screen.getByRole('radio', { name }).parentElement?.querySelector('[data-swatch]')
    expect(swatchOf('Navy')).toHaveAttribute('data-swatch', '#1f2a44')
    expect(swatchOf('Sand')).toHaveAttribute('data-swatch', 'fallback')
    expect(swatchOf('Evil')).toHaveAttribute('data-swatch', 'fallback')
  })
})
