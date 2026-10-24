import { useSyncExternalStore } from 'react'
import { calendarToday } from './calendarDate'

function subscribe(): () => void {
	return () => undefined
}

/** Local calendar date after hydration. The server snapshot is UTC so markup matches. */
export function useCalendarToday(): string {
	return useSyncExternalStore(
		subscribe,
		() => calendarToday(Intl.DateTimeFormat().resolvedOptions().timeZone),
		() => calendarToday('UTC'),
	)
}
