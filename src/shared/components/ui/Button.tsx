import type { ComponentPropsWithoutRef } from 'react'
import { Link } from 'react-router'
import styled, { css } from 'styled-components'

type Variant = 'primary' | 'secondary'

const buttonStyles = css<{ $variant: Variant }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space.xs};
  min-height: 44px;
  padding: ${({ theme }) => `${theme.space.xs} ${theme.space.lg}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  cursor: pointer;
  transition: background-color 120ms ease;

  ${({ theme, $variant }) =>
    $variant === 'primary'
      ? css`
          background: ${theme.colors.primary};
          color: ${theme.colors.onPrimary};
          border: 1px solid ${theme.colors.primary};
          &:hover:not(:disabled):not([aria-disabled='true']) {
            background: ${theme.colors.primaryHover};
          }
        `
      : css`
          background: transparent;
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.text};
          &:hover:not(:disabled):not([aria-disabled='true']) {
            background: ${theme.colors.surface};
          }
        `}

  &:disabled,
  &[aria-disabled='true'] {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const StyledButton = styled.button<{ $variant: Variant }>`
  ${buttonStyles}
`

const StyledButtonLink = styled(Link)<{ $variant: Variant }>`
  ${buttonStyles}
`

type ButtonProps = { variant?: Variant } & ComponentPropsWithoutRef<'button'>

export function Button({ variant = 'primary', type = 'button', ...rest }: ButtonProps) {
  return <StyledButton $variant={variant} type={type} {...rest} />
}

type ButtonLinkProps = { variant?: Variant } & ComponentPropsWithoutRef<typeof Link>

/** A router link styled as a button (navigation, not an action). */
export function ButtonLink({ variant = 'primary', ...rest }: ButtonLinkProps) {
  return <StyledButtonLink $variant={variant} {...rest} />
}
