const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** True when `YYYY-MM-DD` is a real day. `Date.UTC` rolls invalid days, so the parts must round-trip. */
export function isRealCalendarDate(value: string): boolean {
	const match = CALENDAR_DATE.exec(value)
	if (!match) return false
	const year = Number(match[1])
	const month = Number(match[2])
	const day = Number(match[3])
	const date = new Date(Date.UTC(year, month - 1, day))
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/** Calendar date `YYYY-MM-DD` in a timezone. Lexicographic order matches calendar order. */
export function calendarToday(timeZone: string, now = new Date()): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(now)
	const year = parts.find((part) => part.type === 'year')?.value
	const month = parts.find((part) => part.type === 'month')?.value
	const day = parts.find((part) => part.type === 'day')?.value
	if (!year || !month || !day) {
		throw new Error('Could not resolve the calendar date')
	}
	return `${year}-${month}-${day}`
}

/** Format a stored calendar date without shifting it across timezones. */
export function formatCalendarDate(value: string, locale?: string): string {
	const match = CALENDAR_DATE.exec(value)
	if (!match || !isRealCalendarDate(value)) return value
	const year = Number(match[1])
	const month = Number(match[2])
	const day = Number(match[3])
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(Date.UTC(year, month - 1, day)))
}
