import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router'
import styled from 'styled-components'
import { CartLink } from '@/features/cart'
import { media } from '@/shared/theme/theme'

const STORE_NAME = 'Clothing Store'
// Evaluated once at load; avoids an impure call during render.
const COPYRIGHT_YEAR = new Date().getFullYear()

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`

const SkipLink = styled.a`
  position: absolute;
  left: ${({ theme }) => theme.space.md};
  top: -100px;
  z-index: 10;
  padding: ${({ theme }) => `${theme.space.xs} ${theme.space.md}`};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  border-radius: ${({ theme }) => theme.radii.md};

  &:focus {
    top: ${({ theme }) => theme.space.xs};
  }
`

const Container = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.space.md};

  ${media.md} {
    padding: 0 ${({ theme }) => theme.space.xl};
  }
`

const Header = styled.header`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const HeaderInner = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  min-height: 64px;
`

const Brand = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: none;
`

const NavList = styled.ul`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.lg};
  list-style: none;
  margin: 0;
  padding: 0;
`

const NavItem = styled(NavLink)`
  text-decoration: none;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  padding: ${({ theme }) => `${theme.space.xs} 0`};
  border-bottom: 2px solid transparent;

  &:hover,
  &[aria-current='page'] {
    border-bottom-color: currentColor;
  }
`

const Main = styled.main`
  flex: 1;
  padding: ${({ theme }) => `${theme.space.xl} 0 ${theme.space.xxl}`};

  &:focus {
    outline: none;
  }
`

const Footer = styled.footer`
  padding: ${({ theme }) => `${theme.space.lg} 0`};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

/** Moves focus to <main> after client-side navigation so screen-reader users hear the new page. */
function useFocusMainOnNavigation() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return mainRef
}

export function RootLayout() {
  const mainRef = useFocusMainOnNavigation()

  return (
    <Shell>
      <SkipLink href="#main-content">Skip to content</SkipLink>
      <Header>
        <HeaderInner>
          <Brand to="/">{STORE_NAME}</Brand>
          <nav aria-label="Main">
            <NavList>
              <li>
                <NavItem to="/categories">Categories</NavItem>
              </li>
              <li>
                <CartLink />
              </li>
            </NavList>
          </nav>
        </HeaderInner>
      </Header>
      <Main id="main-content" ref={mainRef} tabIndex={-1}>
        <Container>
          <Outlet />
        </Container>
      </Main>
      <Footer>
        <Container>
          © {COPYRIGHT_YEAR} {STORE_NAME}
        </Container>
      </Footer>
      <ScrollRestoration />
    </Shell>
  )
}
