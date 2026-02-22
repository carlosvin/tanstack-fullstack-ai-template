import { MantineProvider } from '@mantine/core'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

/**
 * Renders a component wrapped in the MantineProvider for testing.
 * Extend this helper to include router context when needed.
 */
export function renderWithProviders(ui: ReactNode) {
	return render(<MantineProvider>{ui}</MantineProvider>)
}
