import 'styled-components'
import type { AppTheme } from './theme'

declare module 'styled-components' {
  // Interface merging is required to type the theme; it intentionally adds no members.
  // oxlint-disable-next-line typescript/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
