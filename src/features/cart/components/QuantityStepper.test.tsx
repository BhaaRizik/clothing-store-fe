import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { describe, expect, it, vi } from 'vitest'
import { theme } from '@/shared/theme/theme'
import { QuantityStepper } from './QuantityStepper'

function renderStepper(props: Partial<Parameters<typeof QuantityStepper>[0]> = {}) {
  const onChange = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <QuantityStepper value={1} onChange={onChange} {...props} />
    </ThemeProvider>,
  )
  return { onChange, user: userEvent.setup() }
}

const decrease = () => screen.getByRole('button', { name: 'Decrease quantity' })
const increase = () => screen.getByRole('button', { name: 'Increase quantity' })

describe('QuantityStepper', () => {
  it('is a labelled group showing the value', () => {
    renderStepper({ value: 3, label: 'Quantity for Linen Shirt' })
    expect(screen.getByRole('group', { name: 'Quantity for Linen Shirt' })).toHaveTextContent('3')
  })

  it('reports the next absolute quantity and is keyboard operable', async () => {
    const { onChange, user } = renderStepper({ value: 2 })

    await user.click(increase())
    expect(onChange).toHaveBeenLastCalledWith(3)

    decrease().focus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(1)
  })

  it('cannot go below 1 (it never removes)', async () => {
    const { onChange, user } = renderStepper({ value: 1 })

    expect(decrease()).toHaveAttribute('aria-disabled', 'true')
    await user.click(decrease())
    expect(onChange).not.toHaveBeenCalled()
  })

  it('cannot go above the max', async () => {
    const { onChange, user } = renderStepper({ value: 5, max: 5 })

    expect(increase()).toHaveAttribute('aria-disabled', 'true')
    expect(decrease()).toHaveAttribute('aria-disabled', 'false')
    await user.click(increase())
    expect(onChange).not.toHaveBeenCalled()
  })

  it('disables both steps when disabled', async () => {
    const { onChange, user } = renderStepper({ value: 3, disabled: true })

    await user.click(increase())
    await user.click(decrease())
    expect(onChange).not.toHaveBeenCalled()
    expect(increase()).toHaveAttribute('aria-disabled', 'true')
  })
})
