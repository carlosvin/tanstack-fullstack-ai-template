import type { BrowserContext } from '../types'

/** Snapshot of browser location and locale for the chat API (captured at submit time). */
export function captureBrowserContext(): BrowserContext {
	return {
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		locale: navigator.language,
		currentTime: new Date().toISOString(),
		currentPathname: window.location.pathname,
		currentSearch: window.location.search,
		currentHref: window.location.href,
	}
}
