import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { UserMenu } from '@/components/UserMenu/UserMenu'
import { renderWithProviders } from '@/test-utils/renderWithRouter'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		useNavigate: () => navigate,
	}
})

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

async function openSettingsItem() {
	fireEvent.click(screen.getByRole('button', { name: 'Open user menu' }))
	const menu = await waitFor(() => screen.getByRole('menu', { hidden: true }))
	return within(menu).getByRole('menuitem', { name: 'Settings', hidden: true })
}

describe('UserMenu', () => {
	it('navigates to Settings via menuitem by default', async () => {
		navigate.mockClear()
		renderWithProviders(<UserMenu currentUser={currentUser} />)

		fireEvent.click(await openSettingsItem())
		expect(navigate).toHaveBeenCalledWith({ to: '/settings' })
		expect(screen.getByText('Alice Johnson')).toBeTruthy()
		expect(screen.getByText('alice@example.com')).toBeTruthy()
	})

	it('calls onOpenSettings instead of navigating when provided', async () => {
		navigate.mockClear()
		const onOpenSettings = vi.fn()
		renderWithProviders(<UserMenu currentUser={currentUser} onOpenSettings={onOpenSettings} />)

		fireEvent.click(await openSettingsItem())
		expect(onOpenSettings).toHaveBeenCalledTimes(1)
		expect(navigate).not.toHaveBeenCalled()
	})
})
