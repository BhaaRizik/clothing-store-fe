import styled from 'styled-components'

const Group = styled.div`
  display: inline-flex;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.background};
`

const StepButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  cursor: pointer;

  &:hover:not([aria-disabled='true']) {
    background: ${({ theme }) => theme.colors.surface};
  }

  &[aria-disabled='true'] {
    color: ${({ theme }) => theme.colors.textMuted};
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const Value = styled.span`
  min-width: 2.5rem;
  text-align: center;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-variant-numeric: tabular-nums;
`

type QuantityStepperProps = {
  value: number
  /** Called with the new absolute quantity. */
  onChange: (quantity: number) => void
  /** Maximum quantity when known (e.g. the cart's `maxItemQuantity`). */
  max?: number | null
  disabled?: boolean
  /** Accessible name of the group, e.g. "Quantity" or "Quantity for Linen Shirt". */
  label?: string
  /** Id of a visible label for the group (takes precedence over `label`). */
  labelledBy?: string
}

const MIN_QUANTITY = 1

/**
 * − / value / + quantity control. The minimum is 1: decreasing never removes an item.
 * Unavailable steps use `aria-disabled` (not `disabled`) so keyboard focus stays on the button.
 */
export function QuantityStepper({ value, onChange, max, disabled = false, label = 'Quantity', labelledBy }: QuantityStepperProps) {
  const canDecrease = !disabled && value > MIN_QUANTITY
  const canIncrease = !disabled && (max == null || value < max)

  return (
    <Group role="group" aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy}>
      <StepButton
        type="button"
        aria-label="Decrease quantity"
        aria-disabled={!canDecrease}
        onClick={() => canDecrease && onChange(value - 1)}
      >
        <span aria-hidden="true">−</span>
      </StepButton>
      <Value aria-live="polite">{value}</Value>
      <StepButton
        type="button"
        aria-label="Increase quantity"
        aria-disabled={!canIncrease}
        onClick={() => canIncrease && onChange(value + 1)}
      >
        <span aria-hidden="true">+</span>
      </StepButton>
    </Group>
  )
}
