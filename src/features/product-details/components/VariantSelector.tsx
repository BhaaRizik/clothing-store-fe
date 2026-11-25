import { useId, type ReactNode } from 'react'
import styled, { css } from 'styled-components'
import { VisuallyHidden } from '@/shared/components/ui/VisuallyHidden'
import type { ColorOption, VariantOption } from '../hooks/useVariantSelection'
import { safeHex } from '../utils/safeHex'

const Groups = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  min-width: 0;
`

const Fieldset = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
`

const Legend = styled.legend`
  padding: 0;
  margin-bottom: ${({ theme }) => theme.space.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  overflow-wrap: anywhere;
`

const Options = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.xs};
`

const OptionLabel = styled.label`
  position: relative;
  display: inline-flex;
  max-width: 100%;
`

/** Visually hidden but focusable native radio; the adjacent chip shows its state. */
const Radio = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`

const Chip = styled.span<{ $outOfStock: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
  min-height: 44px;
  min-width: 44px;
  max-width: 100%;
  padding: ${({ theme }) => `${theme.space.xxs} ${theme.space.sm}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  overflow-wrap: anywhere;
  pointer-events: none;

  ${({ $outOfStock, theme }) =>
    $outOfStock &&
    css`
      color: ${theme.colors.textMuted};
      background: ${theme.colors.surface};
      text-decoration: line-through;
    `}

  input:checked + & {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }

  input:focus-visible + & {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  input:disabled + & {
    opacity: 0.45;
    border-style: dashed;
  }
`

const Swatch = styled.span<{ $hex: string | null }>`
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $hex, theme }) =>
    $hex ?? `repeating-linear-gradient(45deg, ${theme.colors.surfaceMuted} 0 3px, ${theme.colors.background} 3px 6px)`};
`

type OptionProps = {
  name: string
  option: VariantOption
  checked: boolean
  onSelect: (value: string) => void
  children: ReactNode
}

function Option({ name, option, checked, onSelect, children }: OptionProps) {
  // An undefined combination (disabled) is not "out of stock"; it simply doesn't exist.
  const outOfStock = !option.disabled && !option.available
  return (
    <OptionLabel>
      <Radio
        type="radio"
        name={name}
        value={option.value}
        checked={checked}
        disabled={option.disabled}
        onChange={() => onSelect(option.value)}
      />
      <Chip $outOfStock={outOfStock}>
        {children}
        {outOfStock && (
          <>
            {' '}
            <VisuallyHidden>(out of stock)</VisuallyHidden>
          </>
        )}
      </Chip>
    </OptionLabel>
  )
}

type VariantSelectorProps = {
  colors: ColorOption[]
  sizes: VariantOption[]
  selectedColor: string | null
  selectedSize: string | null
  onSelectColor: (color: string) => void
  onSelectSize: (size: string) => void
}

/** Color and size radio groups; a group is rendered only when the product has that dimension. */
export function VariantSelector({
  colors,
  sizes,
  selectedColor,
  selectedSize,
  onSelectColor,
  onSelectSize,
}: VariantSelectorProps) {
  const id = useId()

  return (
    <Groups>
      {colors.length > 0 && (
        <Fieldset>
          <Legend>{selectedColor ? `Color: ${selectedColor}` : 'Color'}</Legend>
          <Options>
            {colors.map((option) => (
              <Option
                key={option.value}
                name={`${id}-color`}
                option={option}
                checked={option.value === selectedColor}
                onSelect={onSelectColor}
              >
                <Swatch $hex={safeHex(option.hexCode)} data-swatch={safeHex(option.hexCode) ?? 'fallback'} aria-hidden="true" />
                {option.value}
              </Option>
            ))}
          </Options>
        </Fieldset>
      )}
      {sizes.length > 0 && (
        <Fieldset>
          <Legend>{selectedSize ? `Size: ${selectedSize}` : 'Size'}</Legend>
          <Options>
            {sizes.map((option) => (
              <Option
                key={option.value}
                name={`${id}-size`}
                option={option}
                checked={option.value === selectedSize}
                onSelect={onSelectSize}
              >
                {option.value}
              </Option>
            ))}
          </Options>
        </Fieldset>
      )}
    </Groups>
  )
}
