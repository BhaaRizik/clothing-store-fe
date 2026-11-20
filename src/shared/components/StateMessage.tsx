import { useId, type ReactNode } from 'react'
import styled from 'styled-components'

const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => `${theme.space.xxl} ${theme.space.md}`};
  text-align: center;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  line-height: ${({ theme }) => theme.lineHeights.tight};
`

const Description = styled.p`
  max-width: 40ch;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.xs};
`

export type StateMessageProps = {
  title: string
  description?: string
  /** Next useful action(s): links or buttons. */
  actions?: ReactNode
  role?: 'alert' | 'status'
  /**
   * Heading level of the title. Use 'h1' when the message replaces the whole page
   * (not-found / page-level error) so every screen has exactly one h1.
   */
  titleAs?: 'h1' | 'h2'
}

/** Generic empty / not-found / error message block with optional next actions. */
export function StateMessage({ title, description, actions, role, titleAs = 'h2' }: StateMessageProps) {
  const titleId = useId()
  return (
    <Wrapper aria-labelledby={titleId} role={role}>
      <Title as={titleAs} id={titleId}>
        {title}
      </Title>
      {description && <Description>{description}</Description>}
      {actions && <Actions>{actions}</Actions>}
    </Wrapper>
  )
}
