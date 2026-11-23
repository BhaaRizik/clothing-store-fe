import styled from 'styled-components'
import { ImageWithFallback } from '@/shared/components/ImageWithFallback'
import { ButtonLink } from '@/shared/components/ui/Button'
import { media } from '@/shared/theme/theme'
import { usePromotions } from '../hooks/usePromotions'
import type { PromotionResponse } from '../types/promotion'
import { isInternalPath } from '../utils/isInternalPath'
import { HomeSection } from './HomeSection'

const BannerList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};

  ${media.md} {
    gap: ${({ theme }) => theme.space.lg};
  }
`

const Banner = styled.article`
  display: grid;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};

  ${media.md} {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    align-items: center;
  }
`

const BannerImage = styled(ImageWithFallback)`
  border-radius: 0;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.lg};

  ${media.lg} {
    padding: ${({ theme }) => theme.space.xl};
  }
`

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  line-height: ${({ theme }) => theme.lineHeights.tight};

  ${media.lg} {
    font-size: ${({ theme }) => theme.fontSizes.xxl};
  }
`

const Subtitle = styled.p`
  max-width: 45ch;
  color: ${({ theme }) => theme.colors.textMuted};
`

type PromotionBannerProps = {
  promotion: PromotionResponse
  /** The first banner is above the fold, so its image is not lazy-loaded. */
  priority: boolean
}

function PromotionBanner({ promotion, priority }: PromotionBannerProps) {
  const { title, subtitle, imageUrl, imageAlt, ctaLabel, ctaUrl } = promotion
  const ctaText = ctaLabel?.trim()
  // Defense in depth: only internal app paths become links, even though the backend validates ctaUrl.
  const ctaTo = ctaText && isInternalPath(ctaUrl) ? ctaUrl : null

  return (
    <Banner>
      <BannerImage
        src={imageUrl}
        alt={imageAlt}
        fallbackLabel={`No image available for ${title}`}
        aspectRatio="16 / 9"
        loading={priority ? 'eager' : 'lazy'}
      />
      <Content>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
        {ctaTo && <ButtonLink to={ctaTo}>{ctaText}</ButtonLink>}
      </Content>
    </Banner>
  )
}

/**
 * Active promotions as stacked banners (no carousel). Renders nothing while loading, when there are
 * no promotions, or when the request fails: promotions are optional and must never block the page.
 */
export function PromotionBanners() {
  const { data: promotions } = usePromotions()

  if (!promotions || promotions.length === 0) return null

  return (
    <HomeSection title="Promotions" hideTitle>
      <BannerList>
        {promotions.map((promotion, index) => (
          <li key={promotion.id}>
            <PromotionBanner promotion={promotion} priority={index === 0} />
          </li>
        ))}
      </BannerList>
    </HomeSection>
  )
}
