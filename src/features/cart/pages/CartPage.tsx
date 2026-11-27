import { useRef } from 'react'
import styled from 'styled-components'
import { ErrorState } from '@/shared/components/ErrorState'
import { LoadingState } from '@/shared/components/LoadingState'
import { RefreshErrorNotice } from '@/shared/components/RefreshErrorNotice'
import { StateMessage } from '@/shared/components/StateMessage'
import { ButtonLink } from '@/shared/components/ui/Button'
import { PageTitle } from '@/shared/components/ui/PageTitle'
import { media } from '@/shared/theme/theme'
import { CartItemRow } from '../components/CartItemRow'
import { CartSummary } from '../components/CartSummary'
import { useCart } from '../hooks/useCart'

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.space.lg};

  h1:focus {
    outline: none;
  }
`

const Layout = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.xl};

  ${media.lg} {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    align-items: start;
  }
`

const Lines = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

export function CartPage() {
  const { cart, isLoading, isError, isRefetchError, refetch } = useCart()
  const titleRef = useRef<HTMLHeadingElement>(null)

  if (isLoading) return <LoadingState label="Loading cart" />
  if (!cart && isError) {
    return <ErrorState titleAs="h1" title="We couldn't load your cart" onRetry={() => void refetch()} />
  }

  const empty = !cart || cart.items.length === 0

  return (
    <>
      <title>Your cart | Clothing Store</title>
      <Header>
        {/* Focus target after a removal, so keyboard focus isn't lost with the removed line. */}
        <PageTitle ref={titleRef} tabIndex={-1}>
          Your cart
        </PageTitle>
      </Header>
      {isRefetchError && <RefreshErrorNotice />}
      {empty ? (
        <StateMessage
          title="Your cart is empty"
          description="Browse our categories to find something you like."
          actions={<ButtonLink to="/categories">Continue shopping</ButtonLink>}
        />
      ) : (
        <Layout>
          <Lines aria-label="Cart items">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.variantId}
                item={item}
                cartId={cart.id}
                maxItemQuantity={cart.maxItemQuantity}
                onRemoved={() => titleRef.current?.focus()}
              />
            ))}
          </Lines>
          <CartSummary cart={cart} />
        </Layout>
      )}
    </>
  )
}
