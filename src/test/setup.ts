import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom does not implement scrolling; React Router's <ScrollRestoration> calls it.
// A plain function (not vi.fn) so vi.resetAllMocks() cannot affect it.
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true })

afterEach(() => {
  cleanup()
  // Reset implementations too, so no test depends on stubs left over from another test.
  vi.resetAllMocks()
})
