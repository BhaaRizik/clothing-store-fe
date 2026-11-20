import type { Money } from '@/shared/types/money'

/**
 * Display locale for prices. Store localization is still an open product decision,
 * so a single locale is used until it is decided.
 */
export const DEFAULT_LOCALE = 'en-US'

export const PRICE_UNAVAILABLE = 'Price unavailable'

const DECIMAL_AMOUNT = /^-?\d+(\.\d+)?$/

/** Raw "amount currency" text for values Intl cannot format; never prints "null"/"undefined". */
function rawMoney(amount: string, currency: unknown): string {
  return typeof currency === 'string' && currency.trim() !== '' ? `${amount} ${currency.trim()}` : amount
}

/**
 * Formats an API Money value using its own currency. Never throws and never performs price calculations.
 * - missing money/amount → "Price unavailable"
 * - non-decimal amount or unknown currency → raw amount (+ currency)
 */
export function formatMoney(money: Money | null | undefined, locale: string = DEFAULT_LOCALE): string {
  // Runtime values come from the network, so guard beyond what the static type promises.
  const amount: unknown = money?.amount
  const currency: unknown = money?.currency
  if (typeof amount !== 'string' || amount.trim() === '') return PRICE_UNAVAILABLE

  const trimmed = amount.trim()
  if (!DECIMAL_AMOUNT.test(trimmed) || typeof currency !== 'string') return rawMoney(trimmed, currency)

  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(trimmed))
  } catch {
    // Unknown/invalid ISO currency code.
    return rawMoney(trimmed, currency)
  }
}
