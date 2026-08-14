import { fireEvent, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/renderWithRouter'
import { Header } from './Header'

vi.mock('../Link/Link', () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const appMeta = { name: 'TaskHub', version: '1.0.0' }

describe('Header', () => {
	it('shows the Ask AI control when aiAvailable is true', () => {
		renderWithProviders(
			<Header navOpened={false} onToggleNav={vi.fn()} appMeta={appMeta} aiAvailable onOpenChat={vi.fn()} />,
		)

		expect(screen.getByRole('button', { name: 'Open AI chat' })).toBeTruthy()
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

		fireEvent.click(screen.getByRole('button', { name: 'Toggle navigation' }))
		expect(onToggleNav).toHaveBeenCalledTimes(1)
	})

	it('does not render inline Tasks navigation', () => {
		renderWithProviders(<Header navOpened={false} onToggleNav={vi.fn()} appMeta={appMeta} />)

		expect(screen.queryByText('Tasks')).toBeNull()
	})
})
