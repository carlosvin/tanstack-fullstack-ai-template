import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/renderWithRouter'
import { AppNavbar } from './AppNavbar'

vi.mock('../Link/Link', () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const appMeta = { name: 'TaskHub', version: '1.0.0' }

describe('AppNavbar', () => {
	it('renders Dashboard and Tasks links', () => {
		renderWithProviders(<AppNavbar pathname="/" appMeta={appMeta} />)

		expect(screen.getByRole('link', { name: /dashboard/i }).getAttribute('href')).toBe('/')
		expect(screen.getByRole('link', { name: /tasks/i }).getAttribute('href')).toBe('/tasks')
	})

	it('marks Dashboard as active on the home path', () => {
		renderWithProviders(<AppNavbar pathname="/" appMeta={appMeta} />)

		expect(screen.getByRole('link', { name: /dashboard/i }).getAttribute('data-active')).toBe('true')
		expect(screen.getByRole('link', { name: /tasks/i }).getAttribute('data-active')).toBe('false')
	})

	it('marks Tasks as active on nested task routes', () => {
		renderWithProviders(<AppNavbar pathname="/tasks/task-1" appMeta={appMeta} />)

		expect(screen.getByRole('link', { name: /dashboard/i }).getAttribute('data-active')).toBe('false')
		expect(screen.getByRole('link', { name: /tasks/i }).getAttribute('data-active')).toBe('true')
	})

	it('shows the display name for test users', () => {
		renderWithProviders(
			<AppNavbar
				pathname="/"
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
