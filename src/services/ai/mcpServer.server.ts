/**
 * Optional MCP HTTP server for the same server AI tools used by `/api/chat`.
 *
 * Client tools (`navigate`, `invalidateRouter`) and in-app A2UI view tools
 * (`showTasksView`, `showTaskView`) stay out of this surface — MCP hosts have
 * no SPA router, and task views are data+A2UI in-thread, not MCP Apps UI.
 *
 * @see https://tanstack.com/ai/latest/docs/mcp/server
 */
import { createMCPServer } from '@tanstack/ai-mcp/server'
import {
	createTaskTool,
	deleteTaskTool,
	getAppRuntimeInfoTool,
	getAssigneeOptionsTool,
	getCurrentUserContextTool,
	getDistinctValuesTool,
	getTasksTool,
	getTaskTool,
	getUserAccessTool,
	getUserProfileTool,
	updateTasksStatusTool,
	updateTaskTool,
	updateUserPreferencesTool,
} from '@/services/ai/tools'

/** Server tools shared with chat `dataTools` (CRUD / query only). */
export const mcpDataTools = [
	getTasksTool,
	getTaskTool,
	getDistinctValuesTool,
	getAssigneeOptionsTool,
	getUserProfileTool,
	getUserAccessTool,
	getAppRuntimeInfoTool,
	getCurrentUserContextTool,
	updateUserPreferencesTool,
	createTaskTool,
	updateTaskTool,
	updateTasksStatusTool,
	deleteTaskTool,
] as const

export const mcpServer = createMCPServer({
	name: 'tanstack-fullstack-template',
	version: '1.0.0',
	tools: mcpDataTools,
})

export function handleMcp(request: Request) {
	return mcpServer.fetch(request)
}
