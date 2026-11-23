import type { RouteObject } from 'react-router'
import { LoadingState } from '@/shared/components/LoadingState'
import { RootLayout } from '../layouts/RootLayout'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RouteErrorPage } from '../pages/RouteErrorPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    hydrateFallbackElement: <LoadingState label="Loading page" />,
    children: [
      {
        // Pathless boundary keeps the header/footer visible when a page fails.
        errorElement: <RouteErrorPage />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/features/home')).HomePage }),
          },
          {
            path: 'categories',
            lazy: async () => ({ Component: (await import('@/features/categories')).CategoryListPage }),
          },
          {
            path: 'categories/:slug',
            lazy: async () => ({ Component: (await import('@/features/catalog')).CategoryProductsPage }),
          },
          {
            path: 'products/:slug',
            lazy: async () => ({ Component: (await import('@/features/product-details')).ProductDetailsPage }),
          },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
]
