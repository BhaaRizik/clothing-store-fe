import { NavLink } from 'react-router'
import styled from 'styled-components'
import { useCart } from '../hooks/useCart'

const Link = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  padding: ${({ theme }) => `${theme.space.xs} 0`};
  border-bottom: 2px solid transparent;

  &:hover,
  &[aria-current='page'] {
    border-bottom-color: currentColor;
  }
`

const Count = styled.span`
  min-width: 1.5rem;
  padding: 0 ${({ theme }) => theme.space.xxs};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5rem;
  text-align: center;
`

const cartLinkLabel = (count: number): string =>
  count > 0 ? `Cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Cart'

/** Header link to the cart with the backend's item count (hidden when 0 or unknown). */
export function CartLink() {
  const { cart } = useCart()
  const count = cart?.itemCount ?? 0

  return (
    <Link to="/cart" aria-label={cartLinkLabel(count)}>
      Cart
      {count > 0 && <Count aria-hidden="true">{count}</Count>}
    </Link>
  )
}
