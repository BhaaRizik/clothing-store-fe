import styled from 'styled-components'
import { media } from '@/shared/theme/theme'

type Columns = { base: number; md: number; lg: number }

/** Unstyled list laid out as a mobile-first responsive grid. */
export const ResponsiveGrid = styled.ul<{ $columns: Columns }>`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${({ theme }) => theme.space.md};
  grid-template-columns: repeat(${({ $columns }) => $columns.base}, minmax(0, 1fr));

  ${media.md} {
    gap: ${({ theme }) => theme.space.lg};
    grid-template-columns: repeat(${({ $columns }) => $columns.md}, minmax(0, 1fr));
  }

  ${media.lg} {
    grid-template-columns: repeat(${({ $columns }) => $columns.lg}, minmax(0, 1fr));
  }
`
