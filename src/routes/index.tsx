import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { DashboardPage } from '../components/DashboardPage/DashboardPage'
import { PromptFirstLanding } from '../components/PromptFirstLanding/PromptFirstLanding'
import { getBrowserShellSession, getTasks } from '../services/api/serverFns'
import type { PromptConcept } from '../services/schemas/shellSession'

type HomeTasks = Awaited<ReturnType<typeof getTasks>>

/** Each prompt concept loads home data on its own path. Agentic has no dashboard read. */
const loadHomeTasks: Record<PromptConcept, () => Promise<HomeTasks>> = {
	side: () => getTasks({}),
	'prompt-first': () => getTasks({}),
	agentic: async () => [],
}

export const Route = createFileRoute('/')({
	staticData: { description: 'Home page' },
	loader: async () => {
		const { promptConcept } = await getBrowserShellSession()
		return loadHomeTasks[promptConcept]()
	},
	component: HomeRoute,
})

function SideHome() {
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

function PromptFirstHome() {
	const tasks = Route.useLoaderData()
	const { shellSession, aiAvailable } = useLoaderData({ from: '__root__' })
	if (aiAvailable) return <PromptFirstLanding tasks={tasks} />
	return (
		<DashboardPage
			tasks={tasks}
			appName={shellSession.app.name}
			appVersion={shellSession.app.version}
			env={shellSession.ENV}
		/>
	)
}

function AgenticHome() {
	return null
}

const homeScreens = {
	side: SideHome,
	'prompt-first': PromptFirstHome,
	agentic: AgenticHome,
} satisfies Record<PromptConcept, () => ReactNode>

function HomeRoute() {
	const { shellSession } = useLoaderData({ from: '__root__' })
	const Screen = homeScreens[shellSession.promptConcept]
	return <Screen />
}
