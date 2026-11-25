import { focusManager, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createQueryClient } from '@/app/providers/queryClient'
import { getProductDetails } from '../api/productDetailsApi'
import type { ProductDetailsResponse } from '../types/productDetails'
import { useProductDetails } from './useProductDetails'

vi.mock('../api/productDetailsApi')

const details = { id: 'p-1', slug: 'linen-shirt', variants: [] } as unknown as ProductDetailsResponse

/** Uses the app's real QueryClient defaults (staleTime 30s, no focus refetch) to prove the hook overrides them. */
function setup() {
  vi.mocked(getProductDetails).mockResolvedValue(details)
  const queryClient = createQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const mount = () => renderHook(() => useProductDetails('linen-shirt'), { wrapper })
  return { mount }
}

describe('useProductDetails freshness', () => {
  afterEach(() => focusManager.setFocused(undefined))

  it('refetches when the page is mounted again', async () => {
    const { mount } = setup()
    const first = mount()
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    first.unmount()

    const second = mount()

    await waitFor(() => expect(getProductDetails).toHaveBeenCalledTimes(2))
    expect(second.result.current.data).toEqual(details)
  })

  it('refetches when the window regains focus', async () => {
    const { mount } = setup()
    const { result } = mount()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    act(() => {
      focusManager.setFocused(false)
      focusManager.setFocused(true)
    })

    await waitFor(() => expect(getProductDetails).toHaveBeenCalledTimes(2))
  })
})
