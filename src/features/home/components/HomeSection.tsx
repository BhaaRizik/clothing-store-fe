import { useId, type ReactNode } from 'react'
import styled from 'styled-components'
import { media } from '@/shared/theme/theme'
import { VisuallyHidden } from '@/shared/components/ui/VisuallyHidden'

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};

  ${media.md} {
    gap: ${({ theme }) => theme.space.lg};
  }
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  line-height: ${({ theme }) => theme.lineHeights.tight};

  ${media.md} {
    font-size: ${({ theme }) => theme.fontSizes.xxl};
  }
`

type HomeSectionProps = {
  title: string
  /** Keeps the heading for assistive technology only (e.g. the promotions section). */
  hideTitle?: boolean
  children: ReactNode
}

/** A homepage section labelled by its own h2. */
export function HomeSection({ title, hideTitle = false, children }: HomeSectionProps) {
  const headingId = useId()
  return (
    <Section aria-labelledby={headingId}>
      {hideTitle ? (
        <VisuallyHidden as="h2" id={headingId}>
          {title}
        </VisuallyHidden>
      ) : (
        <Title id={headingId}>{title}</Title>
      )}
      {children}
    </Section>
  )
}
