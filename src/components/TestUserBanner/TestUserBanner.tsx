import { Alert } from '@mantine/core'
import { AlertTriangle } from 'lucide-react'
import type { CurrentUser } from '../../types'

interface TestUserBannerProps {
	currentUser?: CurrentUser
}

/** Warns visitors when the server auto-generated a demo identity. */
export function TestUserBanner({ currentUser }: TestUserBannerProps) {
	if (!currentUser?.isTestUser) return null

	const email = currentUser.identity.email

	return (
		<Alert icon={<AlertTriangle size={16} />} color="yellow" variant="light" title="Test user session" mb="md">
			You are signed in as a demo test user ({email}). Actions in this app are attributed to this identity. Provide a
			real JWT in the configured auth header to use your own account.
		</Alert>
	)
}
