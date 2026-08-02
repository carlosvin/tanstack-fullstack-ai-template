import type { LinkProps } from '@tanstack/react-router'
import { isUserFacingPath } from '../services/ai/navigationManifest'

/** True when href points at an in-app path (not /api/* or external). */
export function isInternalPath(href: string): boolean {
	if (href.startsWith('/')) {
		return !href.startsWith('/api/')
	}

	try {
		const url = new URL(href)
		if (!['http:', 'https:'].includes(url.protocol)) return false
		if (typeof window !== 'undefined' && url.origin === window.location.origin) {
			return !url.pathname.startsWith('/api/')
		}
		return false
	} catch {
		return false
	}
}

/** Splits a path-only or same-origin href into pathname + query params. */
export function parseInternalHref(href: string): { pathname: string; search?: Record<string, string> } {
	const raw = href.startsWith('/')
		? href
		: (() => {
				try {
					return `${new URL(href).pathname}${new URL(href).search}`
				} catch {
					return href
				}
			})()

	const [pathname, searchStr] = raw.split('?')
	const normalizedPath = pathname ?? raw
	if (!searchStr) return { pathname: normalizedPath }

	const search: Record<string, string> = {}
	for (const pair of searchStr.split('&')) {
		const [key, value] = pair.split('=')
		if (key && value !== undefined) {
			search[decodeURIComponent(key)] = decodeURIComponent(value)
		}
	}
	return { pathname: normalizedPath, search }
}

export interface InternalRouterLinkTarget {
	to: LinkProps['to']
	params?: LinkProps['params']
	search?: LinkProps['search']
}

/**
 * Maps a validated internal href to TanStack Router link props.
 * Dynamic task routes use typed `to` + `params` so navigation stays type-safe.
 */
export function toInternalRouterLinkTarget(href: string): InternalRouterLinkTarget | null {
	if (!isInternalPath(href)) return null

	const { pathname, search } = parseInternalHref(href)
	if (!isUserFacingPath(pathname)) return null

	const editMatch = pathname.match(/^\/tasks\/([^/]+)\/edit$/)
	if (editMatch?.[1] && editMatch[1] !== 'new') {
		return {
			to: '/tasks/$taskId/edit',
			params: { taskId: editMatch[1] },
		} satisfies InternalRouterLinkTarget
	}

	const taskMatch = pathname.match(/^\/tasks\/([^/]+)$/)
	if (taskMatch?.[1] && taskMatch[1] !== 'new') {
		return {
			to: '/tasks/$taskId',
			params: { taskId: taskMatch[1] },
		} satisfies InternalRouterLinkTarget
	}

	return {
		to: pathname as LinkProps['to'],
		...(search && Object.keys(search).length > 0 ? { search: search as LinkProps['search'] } : {}),
	} satisfies InternalRouterLinkTarget
}
