import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { variant } from '@/test/variants'
import type { ProductVariant } from '../types/productDetails'
import { useVariantSelection } from './useVariantSelection'

const render = (variants: ProductVariant[]) => renderHook(() => useVariantSelection(variants))

const twoDimensions = [
  variant('v1', 'Navy', 'S'),
  variant('v2', 'Navy', 'M', false),
  variant('v3', 'White', 'M'),
  variant('v4', 'White', 'L'),
  variant('v5', 'Navy', 'L'),
]

describe('useVariantSelection', () => {
  it('derives distinct colors and sizes in first-appearance order with nothing preselected', () => {
    const { result } = render(twoDimensions)

    expect(result.current.colors.map((c) => c.value)).toEqual(['Navy', 'White'])
    expect(result.current.colors[0]?.hexCode).toBe('#1f2a44')
    expect(result.current.sizes.map((s) => s.value)).toEqual(['S', 'M', 'L'])
    expect(result.current.selectedColor).toBeNull()
    expect(result.current.selectedSize).toBeNull()
    expect(result.current.missingSelections).toEqual(['color', 'size'])
    expect(result.current.selectedVariant).toBeNull()
  })

  it('does not disable sizes before a color is chosen; out of stock only if every variant of the size is', () => {
    const { result } = render([variant('v1', 'Navy', 'S', false), variant('v2', 'White', 'S', false), variant('v3', 'White', 'M', false), variant('v4', 'Navy', 'M')])

    expect(result.current.sizes).toEqual([
      { value: 'S', disabled: false, available: false },
      { value: 'M', disabled: false, available: true },
    ])
  })

  it('resolves the exact variant once color and size are selected', () => {
    const { result } = render(twoDimensions)

    act(() => result.current.selectColor('White'))
    expect(result.current.missingSelections).toEqual(['size'])
    act(() => result.current.selectSize('L'))

    expect(result.current.missingSelections).toEqual([])
    expect(result.current.selectedVariant?.id).toBe('v4')
  })

  it('disables sizes not defined for the selected color', () => {
    const { result } = render(twoDimensions)

    act(() => result.current.selectColor('White'))

    expect(result.current.sizes).toEqual([
      { value: 'S', disabled: true, available: false },
      { value: 'M', disabled: false, available: true },
      { value: 'L', disabled: false, available: true },
    ])
  })

  it('keeps an out-of-stock combination selectable and resolves it as unavailable', () => {
    const { result } = render(twoDimensions)

    act(() => result.current.selectColor('Navy'))
    expect(result.current.sizes.find((s) => s.value === 'M')).toEqual({ value: 'M', disabled: false, available: false })
    act(() => result.current.selectSize('M'))

    expect(result.current.selectedVariant).toMatchObject({ id: 'v2', available: false })
  })

  it('clears the selected size when the new color does not define it, and keeps it otherwise', () => {
    const { result } = render(twoDimensions)
    act(() => result.current.selectColor('Navy'))
    act(() => result.current.selectSize('L'))

    act(() => result.current.selectColor('White'))
    expect(result.current.selectedSize).toBe('L')
    expect(result.current.selectedVariant?.id).toBe('v4')

    act(() => result.current.selectColor('Navy'))
    act(() => result.current.selectSize('S'))
    act(() => result.current.selectColor('White'))
    expect(result.current.selectedSize).toBeNull()
    expect(result.current.missingSelections).toEqual(['size'])

    act(() => result.current.selectColor('Navy'))
    expect(result.current.selectedSize).toBeNull()
  })

  it('never disables colors and marks a color out of stock only when all its variants are unavailable', () => {
    const { result } = render([variant('v1', 'Navy', 'S', false), variant('v2', 'Navy', 'M', false), variant('v3', 'Red', 'S')])
    act(() => result.current.selectSize('M'))

    expect(result.current.colors).toEqual([
      { value: 'Navy', hexCode: '#1f2a44', disabled: false, available: false },
      { value: 'Red', hexCode: '#b0261c', disabled: false, available: true },
    ])
  })

  it('handles a color-only product', () => {
    const { result } = render([variant('v1', 'Navy', null), variant('v2', 'Red', null, false)])

    expect(result.current.sizes).toEqual([])
    expect(result.current.missingSelections).toEqual(['color'])
    act(() => result.current.selectColor('Red'))
    expect(result.current.missingSelections).toEqual([])
    expect(result.current.selectedVariant).toMatchObject({ id: 'v2', available: false })
  })

  it('handles a size-only product, disabling nothing and resolving by size', () => {
    const { result } = render([variant('v1', null, 'S'), variant('v2', null, 'M', false)])

    expect(result.current.colors).toEqual([])
    expect(result.current.sizes).toEqual([
      { value: 'S', disabled: false, available: true },
      { value: 'M', disabled: false, available: false },
    ])
    expect(result.current.missingSelections).toEqual(['size'])
    act(() => result.current.selectSize('S'))
    expect(result.current.selectedVariant?.id).toBe('v1')
  })

  it('preselects a dimension that has exactly one value', () => {
    const { result } = render([variant('v1', 'Navy', 'S'), variant('v2', 'Navy', 'M')])

    expect(result.current.selectedColor).toBe('Navy')
    expect(result.current.missingSelections).toEqual(['size'])
  })

  it('fully preselects a single-variant product with both dimensions', () => {
    const { result } = render([variant('v1', 'Navy', 'One size')])

    expect(result.current.selectedColor).toBe('Navy')
    expect(result.current.selectedSize).toBe('One size')
    expect(result.current.selectedVariant?.id).toBe('v1')
  })

  it('resolves a single variant without any dimension immediately', () => {
    const { result } = render([variant('v1', null, null)])

    expect(result.current.colors).toEqual([])
    expect(result.current.sizes).toEqual([])
    expect(result.current.missingSelections).toEqual([])
    expect(result.current.selectedVariant).toMatchObject({ id: 'v1', available: true })
  })

  it('returns no options and no variant for a product without variants', () => {
    const { result } = render([])

    expect(result.current.colors).toEqual([])
    expect(result.current.sizes).toEqual([])
    expect(result.current.missingSelections).toEqual([])
    expect(result.current.selectedVariant).toBeNull()
  })

  it('marks every option out of stock when all variants are unavailable, while keeping them selectable', () => {
    const { result } = render([variant('v1', 'Navy', 'S', false), variant('v2', 'Red', 'M', false)])

    expect(result.current.colors.every((c) => !c.available && !c.disabled)).toBe(true)
    expect(result.current.sizes.every((s) => !s.available && !s.disabled)).toBe(true)
    act(() => result.current.selectColor('Red'))
    act(() => result.current.selectSize('M'))
    expect(result.current.selectedVariant).toMatchObject({ id: 'v2', available: false })
  })

  describe('when the variants change (refetch)', () => {
    const rerenderable = (initial: ProductVariant[]) =>
      renderHook(({ variants }) => useVariantSelection(variants), { initialProps: { variants: initial } })

    it('drops a chosen color that is no longer offered and asks for a color again', () => {
      const { result, rerender } = rerenderable([variant('v1', 'Navy', 'M'), variant('v2', 'Red', 'M')])
      act(() => result.current.selectColor('Red'))
      act(() => result.current.selectSize('M'))

      rerender({ variants: [variant('v1', 'Navy', 'M'), variant('v3', 'White', 'M')] })

      expect(result.current.selectedColor).toBeNull()
      expect(result.current.missingSelections).toEqual(['color'])
      expect(result.current.sizes).toEqual([{ value: 'M', disabled: false, available: true }])
      expect(result.current.selectedVariant).toBeNull()
    })

    it('falls back to the single remaining color when the chosen one disappears', () => {
      const { result, rerender } = rerenderable([variant('v1', 'Navy', 'M'), variant('v2', 'Red', 'M')])
      act(() => result.current.selectColor('Red'))
      act(() => result.current.selectSize('M'))

      rerender({ variants: [variant('v1', 'Navy', 'M')] })

      expect(result.current.selectedColor).toBe('Navy')
      expect(result.current.selectedVariant?.id).toBe('v1')
    })

    it('keeps the selection and reflects new availability for the same combination', () => {
      const { result, rerender } = rerenderable([variant('v1', 'Navy', 'M'), variant('v2', 'Red', 'M')])
      act(() => result.current.selectColor('Navy'))
      act(() => result.current.selectSize('M'))

      rerender({ variants: [variant('v1', 'Navy', 'M', false), variant('v2', 'Red', 'M')] })

      expect(result.current.selectedVariant).toMatchObject({ id: 'v1', available: false })
    })
  })
})
