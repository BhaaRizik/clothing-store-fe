import { describe, expect, it } from 'vitest'
import type { Money } from '@/shared/types/money'
import { formatMoney } from './formatMoney'

/** Simulates malformed network data that does not match the static type. */
const unsafe = (value: unknown) => value as Money

describe('formatMoney', () => {
  it('formats ILS amounts with the shekel sign and two decimals', () => {
    expect(formatMoney({ amount: '49.90', currency: 'ILS' })).toBe('₪49.90')
  })

  it('uses the currency provided by the API', () => {
    expect(formatMoney({ amount: '1234.5', currency: 'USD' })).toBe('$1,234.50')
  })

  it('respects an explicit locale', () => {
    expect(formatMoney({ amount: '10', currency: 'EUR' }, 'de-DE')).toBe('10,00 €')
  })

  it('formats negative and integer amounts', () => {
    expect(formatMoney({ amount: '-5.00', currency: 'ILS' })).toBe('-₪5.00')
    expect(formatMoney({ amount: '0', currency: 'ILS' })).toBe('₪0.00')
  })

  it('trims surrounding whitespace from the amount', () => {
    expect(formatMoney({ amount: ' 12.50 ', currency: 'ILS' })).toBe('₪12.50')
  })

  it.each(['abc', '1e3', '12.', '.5', '1,000.00', '0x10', 'NaN', 'Infinity', '--1'])(
    'shows the raw amount and currency for the non-decimal amount %j',
    (amount) => {
      expect(formatMoney({ amount, currency: 'ILS' })).toBe(`${amount} ILS`)
    },
  )

  it('falls back to raw values for an invalid currency code', () => {
    expect(formatMoney({ amount: '5.00', currency: 'NOT-A-CODE' })).toBe('5.00 NOT-A-CODE')
  })

  it('shows only the amount when the currency is missing', () => {
    expect(formatMoney(unsafe({ amount: '5.00', currency: null }))).toBe('5.00')
    expect(formatMoney({ amount: '5.00', currency: '' })).toBe('5.00')
  })

  it.each([null, undefined])('returns "Price unavailable" for %s money', (money) => {
    expect(formatMoney(money)).toBe('Price unavailable')
  })

  it.each([null, undefined, '', '   ', 42])('returns "Price unavailable" for the amount %j', (amount) => {
    const result = formatMoney(unsafe({ amount, currency: 'ILS' }))
    expect(result).toBe('Price unavailable')
    expect(result).not.toMatch(/null|undefined|NaN/)
  })
})
