# Clothing Store — Frontend

Customer-facing storefront for the Clothing Store (React + TypeScript + Vite). The backend lives in the separate `clothing-store-be` repository.

## Stack
React 19 · TypeScript · Vite · React Router 7 (data mode) · styled-components · TanStack Query · Axios · Vitest + React Testing Library · oxlint.

## Getting started
Requires Node `^20.19.0` or `>=22.12.0`.

```bash
npm install
npm run dev        # http://localhost:5173
```

### Environment
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend origin (without `/api/v1`). Set in `.env.development` / `.env.production`. |

`VITE_*` values are bundled into the public JavaScript — never put secrets in them.

## Scripts
| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run lint` | Lint with oxlint |
| `npm test` | Run unit/component tests once (`vitest run`) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run preview` | Preview the production build |

## Routes
| Path | Page |
|---|---|
| `/` | Storefront homepage: promotions, category highlights, featured products |
| `/categories` | Category list |
| `/categories/:slug` | Product listing for a category ("Load more" pagination, 20 per page, newest first) |
| `/products/:slug` | Product details (read-only) |
| `*` | Not found |

## Project structure (feature-first)
```text
src/
  app/          providers (QueryClient, theme), router, layout shell, app-level pages
  shared/       api (Axios client, ApiError), theme tokens, generic components, utils, types
  features/
    categories/       category list + category API/hooks
    catalog/          category product listing, ProductCard
    product-details/  product details page
  test/         Vitest setup and test helpers
```
- Each feature exposes its public API through `index.ts`; other code must not import a feature's internals.
- `shared/` contains only generic, feature-agnostic code.
- Import alias: `@/` → `src/`.

## API
All requests go through `src/shared/api/httpClient.ts` (`${VITE_API_BASE_URL}/api/v1`). Errors (`application/problem+json`) are normalized to `ApiError { status, code, message, fieldErrors }`. The backend is authoritative for prices and which items are active; the frontend only displays them.

## Testing
Tests live next to the code (`*.test.ts(x)`), run in jsdom, and mock the feature API modules with `vi.mock` — no real network calls.
