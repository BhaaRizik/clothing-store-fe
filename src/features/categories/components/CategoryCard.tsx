import { Link } from 'react-router'
import styled from 'styled-components'
import { ImageWithFallback } from '@/shared/components/ImageWithFallback'
import type { CategoryResponse } from '../types/category'

const Card = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  height: 100%;
  padding: ${({ theme }) => theme.space.sm};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: box-shadow 120ms ease;

  &:hover,
  &:focus-within {
    box-shadow: ${({ theme }) => theme.shadows.card};
  }
`

const Name = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
`

/** Stretched link: the whole card is clickable while the link's accessible name stays the category name. */
const CardLink = styled(Link)`
  text-decoration: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`

const Description = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

type CategoryCardProps = {
  category: CategoryResponse
  /** Heading level of the name: 'h2' on the category list page, 'h3' inside a page section with its own h2. */
  titleAs?: 'h2' | 'h3'
}

export function CategoryCard({ category, titleAs = 'h2' }: CategoryCardProps) {
  return (
    <Card>
      <ImageWithFallback
        src={category.imageUrl}
        alt={category.name}
        fallbackLabel={`No image available for ${category.name}`}
        aspectRatio="4 / 3"
      />
      <Name as={titleAs}>
        <CardLink to={`/categories/${encodeURIComponent(category.slug)}`}>{category.name}</CardLink>
      </Name>
      {category.description && <Description>{category.description}</Description>}
    </Card>
  )
}
