import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { DashboardPage } from '../components/DashboardPage/DashboardPage'
import { getTasks } from '../services/api/serverFns'

export const Route = createFileRoute('/')({
	staticData: { description: 'Home page' },
	loader: () => getTasks({}),
	component: DashboardRoute,
})

function DashboardRoute() {
	const tasks = Route.useLoaderData()
	const { shellSession } = useLoaderData({ from: '__root__' })

	return (
		<DashboardPage
			tasks={tasks}
			appName={shellSession.app.name}
			appVersion={shellSession.app.version}
			env={shellSession.ENV}
		/>
	)
}
