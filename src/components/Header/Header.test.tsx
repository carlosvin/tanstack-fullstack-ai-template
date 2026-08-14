import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/renderWithRouter'
import { Header } from './Header'

vi.mock('../Link/Link', () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const appMeta = { name: 'TaskHub', version: '1.0.0' }

describe('Header', () => {
	it('shows the Ask AI button when aiAvailable is true', () => {
		renderWithProviders(<Header appMeta={appMeta} aiAvailable onOpenChat={vi.fn()} />)

		expect(screen.getByRole('button', { name: 'Open AI chat' }).textContent).toBe('Ask AI')
	})

	it('hides the Ask AI button when aiAvailable is false', () => {
		renderWithProviders(<Header appMeta={appMeta} aiAvailable={false} onOpenChat={vi.fn()} />)

		expect(screen.queryByRole('button', { name: 'Open AI chat' })).toBeNull()
	})

	it('shows the display name for test users', () => {
		renderWithProviders(
			<Header
				appMeta={appMeta}
				currentUser={{
					identity: { email: 'random1234@example.com', name: 'Test User 1234', groups: [] },
					profile: null,
					isTestUser: true,
					roles: [],
				}}
			/>,
		)

		expect(screen.getByText('Test User 1234')).toBeTruthy()
	})
})
