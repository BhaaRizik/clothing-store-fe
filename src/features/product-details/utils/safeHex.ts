const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/** Returns the value only if it is a plain CSS hex color; anything else (null, names, injected CSS) yields null. */
export function safeHex(hexCode: string | null): string | null {
  return hexCode !== null && HEX_COLOR.test(hexCode) ? hexCode : null
}
