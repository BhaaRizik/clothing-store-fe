/**
 * Design tokens. Branding is still an open product decision, so this is a neutral,
 * accessible baseline (text colors meet WCAG AA on the background/surface colors).
 */
export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

/** Mobile-first media queries: `${media.md} { ... }` */
export const media = {
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
} as const

export const theme = {
  colors: {
    background: '#ffffff',
    surface: '#f6f5f3',
    surfaceMuted: '#ebe9e5',
    text: '#1b1a1f',
    textMuted: '#55525c',
    border: '#dcd9d4',
    primary: '#1b1a1f',
    primaryHover: '#3a3840',
    onPrimary: '#ffffff',
    sale: '#b0261c',
    danger: '#b0261c',
    focus: '#1f5fd1',
  },
  space: {
    xxs: '0.25rem',
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  fonts: {
    body: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  fontSizes: {
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.375rem',
    xxl: '1.75rem',
    display: '2.25rem',
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    pill: '999px',
  },
  shadows: {
    card: '0 1px 2px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.06)',
  },
  layout: {
    maxWidth: '1200px',
  },
  breakpoints,
} as const

export type AppTheme = typeof theme
