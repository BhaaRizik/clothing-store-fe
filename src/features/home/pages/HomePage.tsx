import styled from 'styled-components'
import { PageTitle } from '@/shared/components/ui/PageTitle'
import { media } from '@/shared/theme/theme'
import { CategoryHighlights } from '../components/CategoryHighlights'
import { FeaturedProducts } from '../components/FeaturedProducts'
import { PromotionBanners } from '../components/PromotionBanners'

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xl};

  ${media.md} {
    gap: ${({ theme }) => theme.space.xxl};
  }
`

const Intro = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`

const Lead = styled.p`
  max-width: 50ch;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textMuted};
`

/** Storefront homepage. Each section loads independently, so one failing request never hides the others. */
export function HomePage() {
  return (
    <Page>
      <title>Clothing Store</title>
      <Intro>
        <PageTitle>Welcome to Clothing Store</PageTitle>
        <Lead>Discover clothing and accessories for every occasion.</Lead>
      </Intro>
      <PromotionBanners />
      <CategoryHighlights />
      <FeaturedProducts />
    </Page>
  )
}
