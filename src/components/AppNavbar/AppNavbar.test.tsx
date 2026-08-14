import { AppShell } from '@mantine/core'
import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/renderWithRouter'
import { AppNavbar } from './AppNavbar'

vi.mock('../Link/Link', () => ({
	Link: ({ children, to, ...props }: { children: ReactNode; to: string } & Record<string, unknown>) => {
		const { search: _search, ...rest } = props
		return (
			<a href={to} {...rest}>
				{children}
			</a>
		)
	},
}))

const appMeta = { name: 'TaskHub', version: '1.0.0' }

function renderNavbar(ui: ReactNode) {
	return renderWithProviders(
		<AppShell navbar={{ width: 240, breakpoint: 'sm' }}>
			<AppShell.Navbar>{ui}</AppShell.Navbar>
		</AppShell>,
	)
}

describe('AppNavbar', () => {
	it('renders Dashboard and Tasks links', () => {
		renderNavbar(<AppNavbar pathname="/" appMeta={appMeta} />)

		expect(screen.getByRole('link', { name: /dashboard/i }).getAttribute('href')).toBe('/')
		expect(screen.getByRole('link', { name: /tasks/i }).getAttribute('href')).toBe('/tasks')
	})

	it('marks Dashboard as active on the home path', () => {
		renderNavbar(<AppNavbar pathname="/" appMeta={appMeta} />)

		expect(screen.getByRole('link', { name: /dashboard/i }).hasAttribute('data-active')).toBe(true)
		expect(screen.getByRole('link', { name: /tasks/i }).hasAttribute('data-active')).toBe(false)
	})

	it('marks Tasks as active on nested task routes', () => {
		renderNavbar(<AppNavbar pathname="/tasks/task-1" appMeta={appMeta} />)

		expect(screen.getByRole('link', { name: /dashboard/i }).hasAttribute('data-active')).toBe(false)
		expect(screen.getByRole('link', { name: /tasks/i }).hasAttribute('data-active')).toBe(true)
	})

	it('shows the display name for test users', () => {
		renderNavbar(
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
