import { useLocation } from 'react-router'

/** Test probe rendering the current pathname, used to assert navigation. */
export function CurrentLocation() {
  const { pathname } = useLocation()
  return <p data-testid="location">{pathname}</p>
}
