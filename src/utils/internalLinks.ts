import type { LinkProps } from '@tanstack/react-router'
import { matchUserFacingRoute } from '../services/ai/navigationManifest'

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

function parseInternalHref(href: string): { pathname: string; search?: Record<string, string> } {
	if (href.startsWith('/')) {
		const [pathname, searchStr] = href.split('?')
		const normalizedPath = pathname ?? href
		if (!searchStr) return { pathname: normalizedPath }
		return { pathname: normalizedPath, search: searchParamsToRecord(searchStr) }
	}

	try {
		const url = new URL(href)
		const search = searchParamsToRecord(url.search)
		return {
			pathname: url.pathname,
			...(search ? { search } : {}),
		}
	} catch {
		return { pathname: href }
	}
}

function searchParamsToRecord(query: string): Record<string, string> | undefined {
	const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query)
	const search: Record<string, string> = {}
	for (const [key, value] of params.entries()) {
		search[key] = value
	}
	return Object.keys(search).length > 0 ? search : undefined
}

export interface InternalRouterLinkTarget {
	to: LinkProps['to']
	params?: LinkProps['params']
	search?: LinkProps['search']
}

export function toInternalRouterLinkTarget(href: string): InternalRouterLinkTarget | null {
	if (!isInternalPath(href)) return null

	const { pathname, search } = parseInternalHref(href)
	const matched = matchUserFacingRoute(pathname)
	if (!matched) return null

	return {
		to: matched.to as LinkProps['to'],
		...(matched.params ? { params: matched.params } : {}),
		...(search ? { search: search as LinkProps['search'] } : {}),
	}
}
