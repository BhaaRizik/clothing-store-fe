import styled from 'styled-components'
import { media } from '@/shared/theme/theme'

export const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  line-height: ${({ theme }) => theme.lineHeights.tight};
  font-weight: ${({ theme }) => theme.fontWeights.bold};

  ${media.md} {
    font-size: ${({ theme }) => theme.fontSizes.display};
  }
`
