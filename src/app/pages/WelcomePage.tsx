import styled from 'styled-components'
import { ButtonLink } from '@/shared/components/ui/Button'
import { PageTitle } from '@/shared/components/ui/PageTitle'

const Hero = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => `${theme.space.xxl} 0`};
`

const Lead = styled.p`
  max-width: 50ch;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textMuted};
`

/** Temporary landing page; the real homepage is delivered in SCRUM-14. */
export function WelcomePage() {
  return (
    <Hero>
      <title>Clothing Store</title>
      <PageTitle>Welcome to Clothing Store</PageTitle>
      <Lead>Discover clothing and accessories for every occasion.</Lead>
      <ButtonLink to="/categories">Browse categories</ButtonLink>
    </Hero>
  )
}
