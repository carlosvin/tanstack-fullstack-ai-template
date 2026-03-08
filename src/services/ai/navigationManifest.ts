/**
 * App navigation manifest for the AI assistant.
 *
 * This list reflects the user-facing routes from src/routeTree.gen.ts.
 * Exclude /api/* routes. When you add or change routes or search params,
 * update this manifest so the AI knows the app structure.
 */

export interface RouteSearchParam {
	name: string
	description: string
}

export interface AppRoute {
	path: string
	description: string
	searchParams?: RouteSearchParam[]
}

/** User-facing routes and their search params. Source of truth: src/routeTree.gen.ts */
export const APP_NAVIGATION: AppRoute[] = [
	{
		path: '/',
		description: 'Home page',
	},
	{
		path: '/tasks',
		description: 'Tasks list with optional filters',
		searchParams: [
			{ name: 'status', description: 'Filter by status: pending | in-progress | done | cancelled' },
			{ name: 'priority', description: 'Filter by priority: low | medium | high | critical' },
			{ name: 'search', description: 'Full-text search over tasks' },
		],
	},
	{
		path: '/tasks/$taskId',
		description: 'Task detail page; URL pattern is /tasks/<taskId> where $taskId is the concrete task id segment',
	},
	{
		path: '/tasks/new',
		description: 'Create task modal route over the tasks list page',
	},
	{
		path: '/tasks/$taskId/edit',
		description: 'Edit task modal route over the task detail page',
	},
]

/**
 * Returns true if the given path is a valid user-facing route or matches a dynamic segment (e.g. /tasks/abc-123).
 */
export function isUserFacingPath(path: string): boolean {
	const normalized = path.startsWith('/') ? path : `/${path}`
	const segments = normalized.split('/').filter(Boolean)

	if (normalized === '/') return true
	if (normalized === '/tasks' || normalized === '/tasks/') return true
	if (normalized === '/tasks/new') return true
	if (segments.length === 2 && segments[0] === 'tasks' && segments[1] !== 'new') return true
	if (segments.length === 3 && segments[0] === 'tasks' && segments[2] === 'edit' && segments[1] !== 'new') return true
	return false
}

/**
 * Builds a plain-text summary of app navigation for the system prompt.
 */
export function getNavigationPromptSection(): string {
	const lines: string[] = ['## App Navigation', '', 'The app navigation structure (from src/routeTree.gen.ts) is:', '']

	for (const route of APP_NAVIGATION) {
		lines.push(`- **${route.path}**: ${route.description}`)
		if (route.searchParams?.length) {
			for (const p of route.searchParams) {
				lines.push(`  - Query param \`${p.name}\`: ${p.description}`)
			}
		}
		lines.push('')
	}

	return lines.join('\n')
}
