import { useSyncExternalStore } from 'react'
import { calendarToday } from './calendarDate'

function subscribe(onStoreChange: () => void): () => void {
	const refresh = () => onStoreChange()
	const scheduleMidnight = () => {
		const now = new Date()
		const nextMidnight = new Date(now)
		nextMidnight.setHours(24, 0, 0, 0)
		return window.setTimeout(
			() => {
				refresh()
				timer = scheduleMidnight()
			},
			Math.max(1000, nextMidnight.getTime() - now.getTime()),
		)
	}
	let timer = scheduleMidnight()
	window.addEventListener('focus', refresh)
	document.addEventListener('visibilitychange', refresh)
	return () => {
		window.clearTimeout(timer)
		window.removeEventListener('focus', refresh)
		document.removeEventListener('visibilitychange', refresh)
	}
}

/** Local calendar date after hydration. The server snapshot is UTC so markup matches. */
export function useCalendarToday(): string {
	return useSyncExternalStore(
		subscribe,
		() => calendarToday(Intl.DateTimeFormat().resolvedOptions().timeZone),
		() => calendarToday('UTC'),
	)
}
