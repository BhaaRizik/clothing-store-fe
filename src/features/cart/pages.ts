// Route entry of the cart feature, imported only lazily by the router: keeping the page out of `index.ts`
// (which the always-loaded header uses for CartLink) lets the page code be split into its own chunk.
export { CartPage } from './pages/CartPage'
