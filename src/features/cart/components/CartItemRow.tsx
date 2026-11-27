import { Link } from 'react-router'
import styled, { css } from 'styled-components'
import { ImageWithFallback } from '@/shared/components/ImageWithFallback'
import { Price } from '@/shared/components/Price'
import { Button } from '@/shared/components/ui/Button'
import { media } from '@/shared/theme/theme'
import { formatMoney } from '@/shared/utils/formatMoney'
import { useRemoveCartItem } from '../hooks/useRemoveCartItem'
import { useUpdateCartItem } from '../hooks/useUpdateCartItem'
import type { CartItem } from '../types/cart'
import { cartErrorMessage } from '../utils/cartErrorMessage'
import { QuantityStepper } from './QuantityStepper'

export const UNAVAILABLE_ITEM_NAME = 'Item no longer available'

const Row = styled.li<{ $excluded: boolean }>`
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${media.sm} {
    grid-template-columns: 6rem minmax(0, 1fr);
  }

  ${({ $excluded, theme }) =>
    $excluded &&
    css`
      color: ${theme.colors.textMuted};

      img {
        opacity: 0.5;
      }
    `}
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  min-width: 0;
`

const Name = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  overflow-wrap: anywhere;
`

const Attributes = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => `0 ${theme.space.md}`};
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  div {
    display: flex;
    gap: ${({ theme }) => theme.space.xxs};
  }

  dd {
    margin: 0;
  }
`

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.xs};
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`

const LineTotal = styled.p`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`

const Note = styled.p<{ $tone: 'info' | 'warning' }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ $tone, theme }) => ($tone === 'warning' ? theme.colors.danger : theme.colors.textMuted)};
  font-weight: ${({ $tone, theme }) => ($tone === 'warning' ? theme.fontWeights.medium : theme.fontWeights.regular)};
`

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.danger};
`

type CartItemRowProps = {
  item: CartItem
  cartId: string
  maxItemQuantity: number
  /** Called after the line was removed, so the page can move focus. */
  onRemoved?: () => void
}

/** One cart line with its own pending and error state. Prices and totals are displayed as sent by the API. */
export function CartItemRow({ item, cartId, maxItemQuantity, onRemoved }: CartItemRowProps) {
  const update = useUpdateCartItem(cartId)
  const remove = useRemoveCartItem(cartId)
  const pending = update.isPending || remove.isPending
  const failure = update.error ?? remove.error

  const productGone = item.productName === null
  const name = item.productName ?? UNAVAILABLE_ITEM_NAME
  const unavailable = item.status === 'UNAVAILABLE'
  const onSale = item.originalPrice !== null

  const changeQuantity = (quantity: number) => {
    if (pending) return
    remove.reset()
    update.mutate({ variantId: item.variantId, quantity })
  }

  const removeItem = () => {
    if (pending) return
    update.reset()
    remove.mutate(item.variantId, { onSuccess: onRemoved })
  }

  return (
    <Row $excluded={unavailable} aria-busy={pending}>
      <ImageWithFallback
        src={item.image?.url}
        alt={item.image?.alt?.trim() || name}
        fallbackLabel={`No image available for ${name}`}
      />
      <Body>
        <Name>
          {!productGone && item.productSlug ? (
            <Link to={`/products/${encodeURIComponent(item.productSlug)}`}>{name}</Link>
          ) : (
            name
          )}
        </Name>
        {(item.size || item.color) && (
          <Attributes>
            {item.size && (
              <div>
                <dt>Size:</dt>
                <dd>{item.size}</dd>
              </div>
            )}
            {item.color && (
              <div>
                <dt>Color:</dt>
                <dd>{item.color.name}</dd>
              </div>
            )}
          </Attributes>
        )}
        <Price price={onSale ? item.originalPrice : item.unitPrice} salePrice={onSale ? item.unitPrice : null} />

        {unavailable && (
          <Note $tone="info">
            <strong>No longer available.</strong> Not included in the subtotal.
          </Note>
        )}
        {item.status === 'INSUFFICIENT_STOCK' && (
          <Note $tone="warning">Not enough stock for this quantity. Lower the quantity or remove the item.</Note>
        )}
        {item.priceChanged && <Note $tone="info">The price has changed since you added this item.</Note>}

        <Controls>
          <Actions>
            <QuantityStepper
              value={item.quantity}
              max={maxItemQuantity}
              disabled={unavailable || pending}
              label={`Quantity for ${name}`}
              onChange={changeQuantity}
            />
            <Button variant="secondary" aria-label={`Remove ${name}`} aria-disabled={pending} onClick={removeItem}>
              Remove
            </Button>
          </Actions>
          <LineTotal>
            {unavailable ? 'Excluded: ' : 'Total: '}
            {formatMoney(item.lineTotal)}
          </LineTotal>
        </Controls>
        {failure && <ErrorText role="alert">{cartErrorMessage(failure, maxItemQuantity)}</ErrorText>}
      </Body>
    </Row>
  )
}
