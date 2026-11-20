import { Link } from 'react-router'
import styled from 'styled-components'
import { ImageWithFallback } from '@/shared/components/ImageWithFallback'
import { Price } from '@/shared/components/Price'
import type { ProductCardResponse } from '../types/product'

const Card = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  height: 100%;
`

const ImageArea = styled.div`
  transition: opacity 120ms ease;

  ${Card}:hover & {
    opacity: 0.9;
  }
`

const Name = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`

/** Stretched link: the whole card is clickable; the link's accessible name is the product name. */
const CardLink = styled(Link)`
  text-decoration: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: ${({ theme }) => theme.radii.md};
  }

  ${Card}:hover & {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`

type ProductCardProps = {
  product: ProductCardResponse
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.primaryImage
  return (
    <Card>
      <ImageArea>
        <ImageWithFallback
          src={image?.url}
          alt={image?.alt?.trim() || product.name}
          fallbackLabel={`No image available for ${product.name}`}
        />
      </ImageArea>
      <Name>
        <CardLink to={`/products/${encodeURIComponent(product.slug)}`}>{product.name}</CardLink>
      </Name>
      <Price price={product.price} salePrice={product.salePrice} />
    </Card>
  )
}
