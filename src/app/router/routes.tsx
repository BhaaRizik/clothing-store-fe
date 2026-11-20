import type { RouteObject } from 'react-router'
import { LoadingState } from '@/shared/components/LoadingState'
import { RootLayout } from '../layouts/RootLayout'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RouteErrorPage } from '../pages/RouteErrorPage'
import { WelcomePage } from '../pages/WelcomePage'

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
          { index: true, Component: WelcomePage },
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
