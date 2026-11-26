import { fireEvent, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Header } from '@/components/Header/Header'
import { renderWithProviders } from '@/test-utils/renderWithRouter'

vi.mock('@/components/Link/Link', () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const appMeta = { name: 'TaskHub', version: '1.0.0' }

/** jsdom 31 hides `hiddenFrom="sm"` at its fixed 1024px viewport, and the accessible name is empty while `display: none`. */
function getNavToggle() {
	const burger = document.querySelector('button[aria-label="Toggle navigation"]')
	if (!(burger instanceof HTMLButtonElement)) throw new Error('Toggle navigation button not found')
	return burger
}

describe('Header', () => {
	it('shows the Ask AI control when aiAvailable is true', () => {
		renderWithProviders(
			<Header navOpened={false} onToggleNav={vi.fn()} appMeta={appMeta} aiAvailable onOpenChat={vi.fn()} />,
		)

		expect(screen.getByRole('button', { name: 'Open AI chat' })).toBeTruthy()
	})

	it('hides the Ask AI control for prompt-first even when aiAvailable is true', () => {
		renderWithProviders(
			<Header
				navOpened={false}
				onToggleNav={vi.fn()}
				appMeta={appMeta}
				aiAvailable
				promptConcept="prompt-first"
				onOpenChat={vi.fn()}
			/>,
		)

		expect(screen.queryByRole('button', { name: 'Open AI chat' })).toBeNull()
	})

	it('hides the Ask AI control when aiAvailable is false', () => {
		renderWithProviders(
			<Header navOpened={false} onToggleNav={vi.fn()} appMeta={appMeta} aiAvailable={false} onOpenChat={vi.fn()} />,
		)

		expect(screen.queryByRole('button', { name: 'Open AI chat' })).toBeNull()
	})

	it('toggles navigation when the burger is clicked', () => {
		const onToggleNav = vi.fn()
		renderWithProviders(<Header navOpened={false} onToggleNav={onToggleNav} appMeta={appMeta} />)

		fireEvent.click(getNavToggle())
		expect(onToggleNav).toHaveBeenCalledTimes(1)
	})

	it('shows the user menu when currentUser is provided', () => {
		renderWithProviders(
			<Header
				navOpened={false}
				onToggleNav={vi.fn()}
				appMeta={appMeta}
				currentUser={{
					identity: { email: 'alice@example.com', name: 'Alice Johnson', groups: [] },
					profile: {
						email: 'alice@example.com',
						name: 'Alice Johnson',
						avatarUrl: 'https://example.com/a.png',
					},
					isTestUser: false,
					roles: [],
				}}
			/>,
		)

		expect(screen.getByRole('button', { name: 'Open user menu' })).toBeTruthy()
	})
})
