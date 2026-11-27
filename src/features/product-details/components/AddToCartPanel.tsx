import { useId, useState } from 'react'
import { Link } from 'react-router'
import styled from 'styled-components'
import { cartErrorMessage, QuantityStepper, useAddToCart, useCart } from '@/features/cart'
import { Button } from '@/shared/components/ui/Button'
import { media } from '@/shared/theme/theme'
import type { VariantSelection } from '../hooks/useVariantSelection'
import { missingSelectionMessage } from '../utils/missingSelectionMessage'

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`

const QuantityLabel = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`

const AddButton = styled(Button)`
  flex: 1 1 12rem;

  ${media.md} {
    flex: 0 1 auto;
  }
`

const Feedback = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  &:empty {
    display: none;
  }
`

const Alert = styled.p`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.danger};
`

type AddToCartPanelProps = {
  /** The selection shared with the options (see `useVariantSelection`). */
  selection: VariantSelection
}

/**
 * Quantity and "Add to cart" for the selected variant. A missing option sends no request and shows the
 * same prompt as the options status; an unavailable variant disables the button. The backend validates stock.
 */
export function AddToCartPanel({ selection }: AddToCartPanelProps) {
  const labelId = useId()
  const { cart } = useCart()
  const addToCart = useAddToCart()
  const [quantity, setQuantity] = useState(1)
  const [showMissing, setShowMissing] = useState(false)

  const maxQuantity = cart?.maxItemQuantity ?? null
  const shownQuantity = maxQuantity !== null ? Math.min(quantity, maxQuantity) : quantity
  const variant = selection.selectedVariant
  const missingMessage = missingSelectionMessage(selection.missingSelections)
  const unavailable = missingMessage === null && !variant?.available
  // Feedback belongs to the variant it was sent for; it disappears when another variant is selected.
  const forSelectedVariant = variant !== null && addToCart.variables?.variantId === variant.id

  const handleAdd = () => {
    if (addToCart.isPending) return
    if (!variant) {
      setShowMissing(true)
      return
    }
    if (!variant.available) return
    addToCart.mutate({ variantId: variant.id, quantity: shownQuantity })
  }

  return (
    <Section>
      <QuantityLabel id={labelId}>Quantity</QuantityLabel>
      <Row>
        <QuantityStepper
          value={shownQuantity}
          max={maxQuantity}
          labelledBy={labelId}
          onChange={(next) => {
            addToCart.reset()
            setQuantity(next)
          }}
        />
        <AddButton disabled={unavailable} aria-disabled={addToCart.isPending} aria-busy={addToCart.isPending} onClick={handleAdd}>
          Add to cart
        </AddButton>
      </Row>
      {showMissing && missingMessage && <Alert role="alert">{missingMessage}</Alert>}
      {addToCart.isError && forSelectedVariant && (
        <Alert role="alert">{cartErrorMessage(addToCart.error, maxQuantity)}</Alert>
      )}
      <Feedback role="status">
        {addToCart.isPending && 'Adding to cart…'}
        {addToCart.isSuccess && forSelectedVariant && (
          <>
            <span>Added to cart</span>
            <Link to="/cart">View cart</Link>
          </>
        )}
      </Feedback>
    </Section>
  )
}
