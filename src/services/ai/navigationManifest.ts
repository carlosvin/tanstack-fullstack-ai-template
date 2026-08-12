/**
 * App navigation for the AI assistant, derived from the live router
 * (`routesById` + `validateSearch` + route `staticData.description`).
 */
import type { FileRouteTypes } from '../../routeTree.gen'

export interface RouteSearchParam {
	name: string
	description: string
}

export interface AppRoute {
	path: string
	description: string
	searchParams?: RouteSearchParam[]
}

type ApiPath = '/api/chat' | '/api/health'

/** User-facing `to` values from the generated route tree (excludes `/api/*`). */
export type UserFacingTo = Exclude<FileRouteTypes['to'], ApiPath>

interface RouteLike {
	id: string
	fullPath: string
	options: {
		staticData?: { description?: string }
		validateSearch?: unknown
	}
}

interface RouterLike {
	routesById: object
}

function isRouteLike(value: unknown): value is RouteLike {
	if (!value || typeof value !== 'object') return false
	const route = value as Partial<RouteLike>
	return typeof route.id === 'string' && typeof route.fullPath === 'string' && typeof route.options === 'object'
}

function displayPath(fullPath: string): string {
	if (fullPath !== '/' && fullPath.endsWith('/')) return fullPath.slice(0, -1)
	return fullPath
}

function isUserFacingRoute(route: RouteLike): boolean {
	if (route.id === '__root__') return false
	const path = displayPath(route.fullPath)
	return !path.startsWith('/api')
}

function searchParamsFromValidateSearch(validateSearch: unknown): RouteSearchParam[] | undefined {
	if (!validateSearch || typeof validateSearch !== 'object' || !('shape' in validateSearch)) {
		return undefined
	}

	const shape = (validateSearch as { shape: Record<string, { description?: string }> }).shape
	const params = Object.entries(shape).map(([name, schema]) => ({
		name,
		description: schema.description ?? name,
	}))
	return params.length > 0 ? params : undefined
}

/** Build the AI navigation list from a TanStack Router instance. */
export function buildAppNavigation(router: RouterLike): AppRoute[] {
	const seen = new Set<string>()
	const routes: AppRoute[] = []

	for (const value of Object.values(router.routesById as Record<string, unknown>)) {
		if (!isRouteLike(value)) continue
		const route = value
		if (!isUserFacingRoute(route)) continue
		const path = displayPath(route.fullPath)
		if (seen.has(path)) continue
		seen.add(path)

		const description = route.options.staticData?.description ?? path
		const searchParams = searchParamsFromValidateSearch(route.options.validateSearch)
		routes.push({
			path,
			description,
			...(searchParams ? { searchParams } : {}),
		})
	}

	return routes.sort((a, b) => a.path.localeCompare(b.path))
}

/**
 * Returns true if the given path is a valid user-facing route or matches a dynamic segment (e.g. /tasks/abc-123).
 */
export function isUserFacingPath(path: string): boolean {
	return matchUserFacingRoute(path) !== null
}

export interface MatchedUserFacingRoute {
	to: UserFacingTo
	params?: { taskId: string }
}

/**
 * Maps a pathname to a typed TanStack Router destination.
 * Returns null for unknown or non-user-facing paths.
 */
export function matchUserFacingRoute(pathname: string): MatchedUserFacingRoute | null {
	const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
	const segments = normalized.split('/').filter(Boolean)

	if (normalized === '/') return { to: '/' }
	if (normalized === '/tasks' || normalized === '/tasks/') return { to: '/tasks' }
	if (normalized === '/tasks/new') return { to: '/tasks/new' }
	if (segments.length === 2 && segments[0] === 'tasks' && segments[1] !== 'new') {
		return { to: '/tasks/$taskId', params: { taskId: segments[1] } }
	}
	if (segments.length === 3 && segments[0] === 'tasks' && segments[2] === 'edit' && segments[1] !== 'new') {
		return { to: '/tasks/$taskId/edit', params: { taskId: segments[1] } }
	}
	return null
}

/**
 * Builds a plain-text summary of app navigation for the system prompt.
 */
export function getNavigationPromptSection(routes: AppRoute[]): string {
	const lines: string[] = [
		'## App Navigation',
		'',
		'The app navigation structure (from the router route tree) is:',
		'',
		'When you mention a page, task, or filtered list in your reply, include a **markdown link** the user can click:',
		'- Home: `[Home](/)`',
		'- Tasks list: `[Tasks](/tasks)`',
		'- Filtered list: `[In-progress tasks](/tasks?status=in-progress)`',
		'- Task detail: `[View task](/tasks/<taskId>)` (replace `<taskId>` with the real id from tool results)',
		'- Edit task: `[Edit task](/tasks/<taskId>/edit)`',
		'- Create task: `[New task](/tasks/new)`',
		'',
		'Routes:',
		'',
	]

	for (const route of routes) {
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
