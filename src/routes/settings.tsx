import { createFileRoute, useLoaderData, useRouter } from '@tanstack/react-router'
import { SettingsPage } from '@/components/SettingsPage/SettingsPage'

export const Route = createFileRoute('/settings')({
	staticData: { description: 'Account settings and preferences for the signed-in user' },
	component: SettingsRoute,
})

function SettingsRoute() {
	const { currentUser } = useLoaderData({ from: '__root__' })
	const router = useRouter()

	if (!currentUser) {
		return null
	}

	return (
		<SettingsPage
			currentUser={currentUser}
			onSaved={async () => {
				await router.invalidate()
			}}
		/>
	)
}
