import { Link } from 'react-router'
import styled from 'styled-components'
import { Price } from '@/shared/components/Price'
import { PageTitle } from '@/shared/components/ui/PageTitle'
import { media } from '@/shared/theme/theme'
import { useVariantSelection } from '../hooks/useVariantSelection'
import type { ProductDetailsResponse } from '../types/productDetails'
import { imagesForColor } from '../utils/imagesForColor'
import { AddToCartPanel } from './AddToCartPanel'
import { ProductGallery } from './ProductGallery'
import { ProductVariantOptions } from './ProductVariantOptions'

const Layout = styled.article`
  display: grid;
  gap: ${({ theme }) => theme.space.xl};

  ${media.md} {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }
`

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`

const BackLink = styled(Link)`
  align-self: flex-start;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

const Brand = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.colors.textMuted};
`

const PriceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`

const StockBadge = styled.p`
  padding: ${({ theme }) => `${theme.space.xxs} ${theme.space.xs}`};
  border: 1px solid ${({ theme }) => theme.colors.textMuted};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
`

const Unavailable = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`

const Description = styled.p`
  white-space: pre-line;
  max-width: 65ch;
`

type ProductDetailsViewProps = {
  product: ProductDetailsResponse
}

/**
 * Loaded product: owns the variant selection shared by the gallery (follows the selected color) and the options.
 * Mount with `key={product.id}` so the selection resets for another product.
 */
export function ProductDetailsView({ product }: ProductDetailsViewProps) {
  const selection = useVariantSelection(product.variants)
  const { selectedColor } = selection
  const images = imagesForColor(product.images, selectedColor)
  const soldOut = product.variants.length > 0 && product.variants.every((variant) => !variant.available)

  return (
    <Layout>
      {/* Keyed by color so the main image resets to the first image of the new list. */}
      <ProductGallery key={selectedColor ?? ''} images={images} productName={product.name} />
      <Info>
        <BackLink to={`/categories/${encodeURIComponent(product.category.slug)}`}>
          Back to {product.category.name}
        </BackLink>
        {product.brand && <Brand>{product.brand}</Brand>}
        <PageTitle>{product.name}</PageTitle>
        <PriceRow>
          <Price price={product.price} salePrice={product.salePrice} size="lg" />
          {soldOut && <StockBadge>Out of stock</StockBadge>}
        </PriceRow>
        {product.variants.length > 0 ? (
          <>
            <ProductVariantOptions selection={selection} />
            <AddToCartPanel selection={selection} />
          </>
        ) : (
          <Unavailable>Currently unavailable</Unavailable>
        )}
        {product.description?.trim() && <Description>{product.description}</Description>}
      </Info>
    </Layout>
  )
}
