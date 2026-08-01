export function statusColor(status: string): string {
	const map = {
		pending: 'yellow',
		'in-progress': 'teal',
		done: 'green',
		cancelled: 'gray',
	} as const satisfies Record<string, string>
	return map[status as keyof typeof map] ?? 'gray'
}

export function priorityColor(priority: string): string {
	const map = {
		low: 'gray',
		medium: 'blue',
		high: 'orange',
		critical: 'red',
	} as const satisfies Record<string, string>
	return map[priority as keyof typeof map] ?? 'gray'
}
