import { fireEvent, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { UserMenu } from '@/components/UserMenu/UserMenu'
import { renderWithProviders } from '@/test-utils/renderWithRouter'

vi.mock('@/components/Link/Link', () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const currentUser = {
	identity: { email: 'alice@example.com', name: 'Alice Johnson', groups: [] },
	profile: {
		email: 'alice@example.com',
		name: 'Alice Johnson',
		avatarUrl: 'https://example.com/a.png',
	},
	isTestUser: false,
	roles: ['Engineering Lead'],
}

describe('UserMenu', () => {
	it('opens Settings via route link by default', async () => {
		renderWithProviders(<UserMenu currentUser={currentUser} />)

		fireEvent.click(screen.getByRole('button', { name: 'Open user menu' }))
		const settings = await waitFor(() => screen.getByText('Settings'))
		expect(settings.closest('a')?.getAttribute('href')).toBe('/settings')
		expect(screen.getByText('Alice Johnson')).toBeTruthy()
		expect(screen.getByText('alice@example.com')).toBeTruthy()
	})

	it('calls onOpenSettings instead of linking when provided', async () => {
		const onOpenSettings = vi.fn()
		renderWithProviders(<UserMenu currentUser={currentUser} onOpenSettings={onOpenSettings} />)

		fireEvent.click(screen.getByRole('button', { name: 'Open user menu' }))
		fireEvent.click(await waitFor(() => screen.getByText('Settings')))
		expect(onOpenSettings).toHaveBeenCalledTimes(1)
	})
})
