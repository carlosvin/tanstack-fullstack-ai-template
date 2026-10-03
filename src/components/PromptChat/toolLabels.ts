/** Maps tool call names to user-friendly loading labels. */
export function getToolLabel(toolName: string): string {
	const labels: Record<string, string> = {
		getTasks: 'searching tasks',
		getTask: 'loading task details',
		getDistinctValues: 'checking filter options',
		navigate: 'opening page',
		invalidateRouter: 'refreshing data',
		getUserAccess: 'checking access roles',
		getCurrentUserContext: 'checking permissions',
		createTask: 'creating task',
		updateTask: 'updating task',
		deleteTask: 'deleting task',
	}
	return labels[toolName] ?? toolName
}
