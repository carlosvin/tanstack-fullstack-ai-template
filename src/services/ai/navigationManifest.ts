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

/** User-facing `to` values from the generated route tree (excludes `/api/*`). */
export type UserFacingTo = Exclude<FileRouteTypes['to'], `/api/${string}`>

/**
 * Exhaustive runtime list of user-facing route patterns. Adding a file route
 * that is not under `/api/` fails typecheck until it is listed here.
 */
const USER_FACING_ROUTE_PATTERNS = {
	'/': '/',
	'/tasks': '/tasks',
	'/tasks/new': '/tasks/new',
	'/tasks/$taskId': '/tasks/$taskId',
	'/tasks/$taskId/edit': '/tasks/$taskId/edit',
} as const satisfies Record<UserFacingTo, UserFacingTo>

interface RouteLike {
	id: string
	fullPath: string
	options: {
		staticData?: { description?: string }
		validateSearch?: unknown
	}
}

function displayPath(fullPath: string): string {
	if (fullPath !== '/' && fullPath.endsWith('/')) return fullPath.slice(0, -1)
	return fullPath
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
export function buildAppNavigation(router: { routesById: object }): AppRoute[] {
	const seen = new Set<string>()
	const routes: AppRoute[] = []

	for (const value of Object.values(router.routesById as Record<string, unknown>)) {
		if (!value || typeof value !== 'object') continue
		const route = value as Partial<RouteLike>
		if (typeof route.id !== 'string' || typeof route.fullPath !== 'string' || typeof route.options !== 'object') {
			continue
		}
		if (route.id === '__root__') continue
		const path = displayPath(route.fullPath)
		if (path.startsWith('/api') || seen.has(path)) continue
		seen.add(path)

		const searchParams = searchParamsFromValidateSearch(route.options.validateSearch)
		routes.push({
			path,
			description: route.options.staticData?.description ?? path,
			...(searchParams ? { searchParams } : {}),
		})
	}

	return routes.sort((a, b) => a.path.localeCompare(b.path))
}

export interface MatchedUserFacingRoute {
	to: UserFacingTo
	params?: Record<string, string>
}

function normalizePathname(pathname: string): string {
	const withSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
	return displayPath(withSlash)
}

function matchPattern(pathname: string, pattern: UserFacingTo): Record<string, string> | null {
	if (pattern === '/') return pathname === '/' ? {} : null

	const pathSegs = pathname.split('/').filter(Boolean)
	const patSegs = pattern.split('/').filter(Boolean)
	if (pathSegs.length !== patSegs.length) return null

	const params: Record<string, string> = {}
	for (let i = 0; i < patSegs.length; i++) {
		const pat = patSegs[i]
		const seg = pathSegs[i]
		if (!pat || !seg) return null
		if (pat.startsWith('$')) {
			params[pat.slice(1)] = seg
			continue
		}
		if (pat !== seg) return null
	}
	return params
}

function patternSpecificity(pattern: string): number {
	const segs = pattern.split('/').filter(Boolean)
	const staticCount = segs.filter((s) => !s.startsWith('$')).length
	return segs.length * 10 + staticCount
}

/**
 * Maps a pathname to a typed TanStack Router destination using `$param` patterns.
 * Returns null for unknown or non-user-facing paths.
 */
export function matchUserFacingRoute(pathname: string): MatchedUserFacingRoute | null {
	const normalized = normalizePathname(pathname)
	const patterns = Object.values(USER_FACING_ROUTE_PATTERNS).sort(
		(a, b) => patternSpecificity(b) - patternSpecificity(a),
	)

	for (const pattern of patterns) {
		const params = matchPattern(normalized, pattern)
		if (params === null) continue
		return Object.keys(params).length > 0 ? { to: pattern, params } : { to: pattern }
	}
	return null
}

function exampleHref(path: string): string {
	return path.replace(/\$(\w+)/g, '<$1>')
}

/**
 * Builds a plain-text summary of app navigation for the system prompt.
 * Markdown link examples are generated from the provided routes only.
 */
export function getNavigationPromptSection(routes: AppRoute[]): string {
	const lines: string[] = [
		'## App Navigation',
		'',
		'The app navigation structure (from the router route tree) is:',
		'',
		'When you mention a page, task, or filtered list in your reply, include a **markdown link** the user can click.',
		'Use these path patterns (replace `<param>` placeholders with real ids from tool results):',
		'',
	]

	for (const route of routes) {
		const href = exampleHref(route.path)
		lines.push(`- ${route.path}: \`[${route.path === '/' ? 'Home' : route.path}](${href})\``)
		if (route.searchParams?.some((p) => p.name === 'status')) {
			lines.push(`  - Example filter: \`[In-progress tasks](${href}?status=in-progress)\``)
		}
	}

	lines.push('', 'Routes:', '')

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
