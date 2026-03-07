import { MantineProvider } from '@mantine/core'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

/**
 * Renders a component wrapped in the MantineProvider for testing.
 *
 * If your component uses TanStack Router hooks (Link, useNavigate, etc.),
 * extend this helper to include a RouterProvider with a memory history:
 *
 * ```tsx
 * import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
 *
 * const root = createRootRoute({ component: () => <>{ui}</> })
 * const router = createRouter({ routeTree: root, history: createMemoryHistory({ initialEntries: ['/'] }) })
 * await router.load()
 * render(<RouterProvider router={router} />)
 * ```
 */
export function renderWithProviders(ui: ReactNode) {
	return render(<MantineProvider>{ui}</MantineProvider>)
}
