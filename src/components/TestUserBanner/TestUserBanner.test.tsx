import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../test-utils/renderWithRouter'
import { TestUserBanner } from './TestUserBanner'

describe('TestUserBanner', () => {
	it('renders a warning for test users', () => {
		renderWithProviders(
			<TestUserBanner
				currentUser={{
					identity: { email: 'random1234@example.com', name: 'Test User 1234', groups: [] },
					profile: null,
					isTestUser: true,
				}}
			/>,
		)

		expect(screen.getByText('Test user session')).toBeTruthy()
		expect(screen.getByText(/random1234@example\.com/)).toBeTruthy()
	})

	it('renders nothing for real users', () => {
		renderWithProviders(
			<TestUserBanner
				currentUser={{
					identity: { email: 'alice@example.com', name: 'Alice', groups: [] },
					profile: null,
					isTestUser: false,
				}}
			/>,
		)

		expect(screen.queryByText('Test user session')).toBeNull()
	})
})
