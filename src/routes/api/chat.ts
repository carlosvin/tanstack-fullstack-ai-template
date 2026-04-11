import { chat, convertMessagesToModelMessages, maxIterations, toServerSentEventsResponse } from '@tanstack/ai'
import { createFileRoute } from '@tanstack/react-router'
import type { AuthContext } from '../../middleware/auth'
import { getAIAdapterService } from '../../services/ai/adapter'
import { getNavigationPromptSection } from '../../services/ai/navigationManifest'
import {
	createTaskTool,
	deleteTaskTool,
	getAssigneesTool,
	getCurrentUserContextTool,
	getTasksTool,
	getTaskTool,
	getUserProfileTool,
	invalidateRouterToolDef,
	navigateToolDef,
	updateTaskTool,
} from '../../services/ai/tools'
import { getObservability } from '../../services/observability'
import { BrowserContextSchema } from '../../services/schemas/schemas'
import type { BrowserContext, UserIdentity, UserProfile } from '../../types'

const BASE_SYSTEM_PROMPT = `You are a helpful task management assistant. You have access to tools that let you query the task database, create/update/delete tasks, and navigate the app.

## Capabilities
- Search and filter tasks by status, priority, assignee, or free text
- Get detailed information about specific tasks
- List all assignees
- Navigate the user to app pages (use the navigate tool)
- Create, update, and delete tasks (when the user is allowed)
- Check who is logged in and what they can do (getCurrentUserContext)
- Refresh the page data after mutations (use the invalidateRouter tool)

## Data Model
Each task has:
- id: unique identifier
- title: short summary
- description: detailed info
- status: pending | in-progress | done | cancelled
- priority: low | medium | high | critical
- assignee: email of the assigned person
- createdAt / updatedAt: timestamps
- createdBy: email of the creator

## Links and navigation
- Use **markdown links** in your replies so the user can click to go to a page (e.g. \`[View task](/tasks/123)\`, \`[Tasks](/tasks)\`, \`[Filter by status](/tasks?status=done)\`).
- **Query params** can be used in links (e.g. \`/tasks?status=in-progress&priority=high\`).
- When it would help to open a page for the user, call the **navigate** tool with \`to\` (path) and optional \`search\` (query params object). You can also include a link in your message.

## Mutations and data refresh
- After **createTask**, **updateTask**, or **deleteTask**, always call **invalidateRouter** so the user sees the latest data without refreshing the page.

## Permissions and errors
- Call **getCurrentUserContext** to see who is logged in and what they can do (create / edit / delete).
- You can **createTask**, **updateTask**, and **deleteTask**. If the user is not allowed, the tool returns an error with a \`code\`: 401 (not logged in), 403 (only the task creator can edit/delete), or 404 (task not found). When you get 401, tell the user they need to log in to perform that action. When you get 403, tell them only the task creator can edit or delete that task.

## Guidelines
- Use the getTasks tool with filters when the user asks about tasks matching criteria.
- Use the getTask tool when the user asks about a specific task.
- Use getAssignees to discover team members, and getUserProfile to resolve display names and roles from emails.
- Format responses clearly using markdown.
- When listing tasks, include their status and priority.
- Be concise but thorough.`

function buildSystemPrompt(
	user: UserIdentity,
	profile: UserProfile | null,
	browserContext: BrowserContext | null,
): string {
	const sections: string[] = [BASE_SYSTEM_PROMPT, getNavigationPromptSection()]

	const displayName = profile?.name || user.name || 'Anonymous'
	const role = profile?.role ?? 'User'

	sections.push(`
## Current User
- Name: ${displayName}
- Email: ${user.email || 'not authenticated'}
- Role: ${role}`)

	if (browserContext) {
		const formattedDate = new Date(browserContext.currentTime).toLocaleString(browserContext.locale, {
			timeZone: browserContext.timezone,
			dateStyle: 'full',
			timeStyle: 'long',
		})

		sections.push(`
## Browser Context
- Timezone: ${browserContext.timezone}
- Locale: ${browserContext.locale}
- Current date and time: ${formattedDate}`)

		const currentPath = browserContext.currentPathname
		const currentSearch = browserContext.currentSearch
		const currentHref = browserContext.currentHref

		if (currentPath || currentSearch || currentHref) {
			const fullPath = `${currentPath ?? ''}${currentSearch ?? ''}` || 'unknown'
			const taskDetailMatch = currentPath?.match(/^\/tasks\/([^/]+)$/)
			const currentTaskId = taskDetailMatch?.[1]

			const locationLines = [
				'## Current Location',
				`- Current path: ${fullPath}`,
				`- Full URL: ${currentHref ?? 'unknown'}`,
			]

			if (currentTaskId) {
				locationLines.push(
					`- This matches the task detail route pattern \`/tasks/$taskId\`; the current \`$taskId\` is \`${currentTaskId}\`.`,
					'- When the user says "this task" or "the current task", default to this task id unless they specify another one.',
				)
			}

			sections.push(`\n${locationLines.join('\n')}`)
		}
	}

	return sections.join('\n')
}

export const Route = createFileRoute('/api/chat')({
	server: {
		handlers: {
			GET: () => {
				const ai = getAIAdapterService()
				return Response.json({ available: ai.isConfigured() })
			},
			POST: async ({ request, context }) => {
				const ai = getAIAdapterService()
				const adapter = ai.getAdapter() as Parameters<typeof chat>[0]['adapter'] | null

				if (!adapter) {
					const message = ai.getMissingConfigMessage() ?? 'AI chat is not configured'
					console.error(`[ai] ${message}`)
					getObservability().captureError(new Error(message))
					return Response.json({ error: message }, { status: 503 })
				}

				const body = await request.json()

				const { user, userProfile } = context as AuthContext

				const browserContextResult = BrowserContextSchema.safeParse(body.browserContext)
				const browserContext: BrowserContext | null = browserContextResult.success ? browserContextResult.data : null

				const systemPrompt = buildSystemPrompt(user, userProfile, browserContext)
				const tools = [
					getTasksTool,
					getTaskTool,
					getAssigneesTool,
					getUserProfileTool,
					getCurrentUserContextTool,
					createTaskTool,
					updateTaskTool,
					deleteTaskTool,
					navigateToolDef,
					invalidateRouterToolDef,
				]

				const stream = chat({
					adapter,
					messages: convertMessagesToModelMessages(body.messages ?? []) as Parameters<typeof chat>[0]['messages'],
					systemPrompts: [systemPrompt],
					tools,
					agentLoopStrategy: maxIterations(10),
				})

				return toServerSentEventsResponse(stream)
			},
		},
	},
})
