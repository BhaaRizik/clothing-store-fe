export const cartKeys = {
  all: ['cart'] as const,
  detail: (cartId: string | null) => [...cartKeys.all, cartId] as const,
}
