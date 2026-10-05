import { chat, convertMessagesToModelMessages, maxIterations, toServerSentEventsResponse } from '@tanstack/ai'
import { createFileRoute } from '@tanstack/react-router'
import { getRouterInstance } from '@tanstack/react-start'
import { getShellSession } from '../../env/webEnv.server'
import { getAIAdapterService } from '../../services/ai/adapter'
import {
	buildAppNavigation,
	getNavigationPromptSection,
	matchUserFacingRoute,
} from '../../services/ai/navigationManifest'
import { connectTaskViewsMcp } from '../../services/ai/taskViewsMcp.server'
import {
	createTaskTool,
	deleteTaskTool,
	getAppRuntimeInfoTool,
	getCurrentUserContextTool,
	getDistinctValuesTool,
	getTasksTool,
	getTaskTool,
	getUserAccessTool,
	getUserProfileTool,
	invalidateRouterToolDef,
	navigateToolDef,
	updateTaskTool,
} from '../../services/ai/tools'
import { getObservability } from '../../services/observability'
import { BrowserContextSchema } from '../../services/schemas/schemas'
import type { PromptConcept } from '../../services/schemas/shellSession'
import type { BrowserContext, UserIdentity, UserProfile } from '../../types'
import { createServerLogger } from '../../utils/serverLogger'

const log = createServerLogger('apiChat')

const BASE_SYSTEM_PROMPT = `You are a helpful task management assistant. You have access to tools that let you query the task database, create/update/delete tasks, and navigate the app.

## Capabilities
- Search and filter tasks by status, priority, assignee, or free text
- Get detailed information about specific tasks
- List distinct filter values that exist in the data (getDistinctValues for assignee, status, or priority)
- Navigate the user to app pages (use the navigate tool)
- Create, update, and delete tasks (when the user is allowed)
- Check who is logged in and what they can do (getCurrentUserContext)
- Look up app name, version, and deployment environment (getAppRuntimeInfo)
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
- lastModifiedBy: email of the last editor

## Links and navigation
- Include clickable **markdown links** when you reference a page, task, or filtered list. Use real task ids from tool results — see **App Navigation** below for path examples.
- After listing tasks, link each one to its detail page. After creating a task, link to the new task.
- When it would help to open a page for the user, call the **navigate** tool with \`to\` and optional \`search\`. You can also include a link in your message.

## Mutations and data refresh
- After **createTask**, **updateTask**, or **deleteTask**, always call **invalidateRouter** so the user sees the latest data without refreshing the page.

## Permissions and errors
- Call **getCurrentUserContext** to see who is logged in and what they can do (create / edit / delete).
- You can **createTask**, **updateTask**, and **deleteTask**. If the user is not allowed, the tool returns an error with a \`code\`: 401 (not logged in), 403 (only the task creator can edit/delete), or 404 (task not found). When you get 401, tell the user they need to log in to perform that action. When you get 403, tell them only the task creator can edit or delete that task.

## Guidelines
- Use the getTasks tool with filters when the user asks about tasks matching criteria.
- Use the getTask tool when the user asks about a specific task.
- Use getDistinctValues to discover real filter options (e.g. assignees), and getUserProfile to resolve display names and roles from emails.
- Format responses clearly using markdown.
- When listing tasks, include their status and priority.
- Be concise but thorough.`

const PROMPT_FIRST_LAYOUT = `## Prompt-first layout
This deployment uses the **prompt-first** concept: the user always sees the prompt bar at the top, then an overview on \`/\` and drill-down routes below.
- Prefer markdown links and the **navigate** tool to open \`/tasks\`, filtered lists, and task detail pages.
- The home dashboard summarizes counts — link to \`/tasks\` with \`search\` params rather than repeating full tables in chat.
- After navigation, the prompt stays visible; "this task" resolves from Current Location on detail routes.`

const AGENTIC_LAYOUT = `## Fully agentic layout
This deployment uses the **fully agentic** concept: a thin shell with a prompt and a response surface. There are no app pages, no navigation, and no overview dashboard.
- When the user needs to see tasks, call **showTasksView** (not getTasks). When they need one task, call **showTaskView** (not getTask). Each returns data plus a linked MCP UI resource that renders inline.
- Never link to \`/tasks\` or any in-app route. Never call **navigate** or **invalidateRouter** — they do not exist here. After a write, re-render from the new tool result.
- Tool schemas are the map of what this app can do. There is no current page, so nothing resolves "this item" from a URL — always confirm which task the user means.`

const AGENTIC_SYSTEM_PROMPT = `You are a helpful task management assistant. You have access to tools that let you query the task database, create/update/delete tasks, and render interactive task views in the conversation.

## Capabilities
- Search and filter tasks by status, priority, assignee, or free text (getTasks)
- Get detailed information about specific tasks (getTask)
- List distinct filter values that exist in the data (getDistinctValues for assignee, status, or priority)
- Render a task list or task detail as an interactive inline view (showTasksView, showTaskView)
- Create, update, and delete tasks (when the user is allowed)
- Check who is logged in and what they can do (getCurrentUserContext)
- Look up app name, version, and deployment environment (getAppRuntimeInfo)

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
- lastModifiedBy: email of the last editor

## Views and follow-ups
- Prefer **showTasksView** and **showTaskView** when the user should see a list or detail. Do not describe pages or routes — views appear inline in the thread.
- After **createTask**, **updateTask**, or **deleteTask**, call **showTasksView** or **showTaskView** again so the user sees fresh data. There is no page refresh tool.

## Permissions and errors
- Call **getCurrentUserContext** to see who is logged in and what they can do (create / edit / delete).
- You can **createTask**, **updateTask**, and **deleteTask**. If the user is not allowed, the tool returns an error with a \`code\`: 401 (not logged in), 403 (only the task creator can edit/delete), or 404 (task not found). When you get 401, tell the user they need to log in to perform that action. When you get 403, tell them only the task creator can edit or delete that task.

## Guidelines
- Use getDistinctValues to discover real filter options (e.g. assignees), and getUserProfile to resolve display names and roles from emails.
- Format responses clearly using markdown. Do not use markdown links to in-app paths.
- Be concise but thorough.

## Answers
- Greetings and questions about what you can do stay as text. Do not call showTasksView or showTaskView for them.
- "My tasks" means every task. The current user is often unauthenticated and has no assignee. Set assignee only when the user names a person.
- After showTasksView or showTaskView, write one short sentence. Do not repeat titles, statuses, priorities, or emails — the inline view shows them.
- Trust the tool result. If it contains tasks, do not say the list is empty.
- A message that names one task, including "Show task <id>", must call showTaskView with that taskId. Do not answer with a list of other tasks.
- Do not write markdown links. This shell has no pages.`

function buildSystemPrompt(
	user: UserIdentity,
	profile: UserProfile | null,
	browserContext: BrowserContext | null,
	isTestUser: boolean,
	navigationSection: string,
	promptConcept: PromptConcept,
): string {
	const isAgentic = promptConcept === 'agentic'
	const sections: string[] = isAgentic ? [AGENTIC_SYSTEM_PROMPT, AGENTIC_LAYOUT] : [BASE_SYSTEM_PROMPT]
	if (!isAgentic) {
		sections.push(navigationSection)
		if (promptConcept === 'prompt-first') {
			sections.push(PROMPT_FIRST_LAYOUT)
		}
	}

	const displayName = profile?.name || user.name || 'Anonymous'
	const role = profile?.role ?? 'User'

	sections.push(`
## Current User
- Name: ${displayName}
- Email: ${user.email || 'not authenticated'}
- Role: ${role}
- Test user: ${isTestUser ? 'yes (auto-generated demo identity)' : 'no'}`)

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
			const matchedRoute = currentPath ? matchUserFacingRoute(currentPath) : null
			const currentTaskId = matchedRoute?.params?.taskId

			const locationLines = [
				'## Current Location',
				`- Current path: ${fullPath}`,
				`- Full URL: ${currentHref ?? 'unknown'}`,
			]

			if (currentTaskId && matchedRoute) {
				locationLines.push(
					`- This matches route \`${matchedRoute.to}\`; the current \`$taskId\` is \`${currentTaskId}\`.`,
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
					log.error({ message }, 'AI chat is not configured')
					getObservability({}).captureError(new Error(message))
					return Response.json({ error: message }, { status: 503 })
				}

				const body = await request.json()

				const { accessTicket } = context

				const browserContextResult = BrowserContextSchema.safeParse(body.browserContext)
				const browserContext: BrowserContext | null = browserContextResult.success ? browserContextResult.data : null

				const router = await getRouterInstance()
				const promptConcept = getShellSession().promptConcept
				const systemPrompt = buildSystemPrompt(
					accessTicket.identity,
					accessTicket.profile,
					browserContext,
					accessTicket.isTestUser,
					getNavigationPromptSection(buildAppNavigation(router)),
					promptConcept,
				)
				const dataTools = [
					getTasksTool,
					getTaskTool,
					getDistinctValuesTool,
					getUserProfileTool,
					getUserAccessTool,
					getAppRuntimeInfoTool,
					getCurrentUserContextTool,
					createTaskTool,
					updateTaskTool,
					deleteTaskTool,
				]
				const tools = promptConcept === 'agentic' ? dataTools : [...dataTools, navigateToolDef, invalidateRouterToolDef]
				const taskViews = promptConcept === 'agentic' ? await connectTaskViewsMcp() : undefined

				const stream = chat({
					adapter,
					messages: convertMessagesToModelMessages(body.messages ?? []) as Parameters<typeof chat>[0]['messages'],
					systemPrompts: [systemPrompt],
					tools,
					...(taskViews ? { mcp: { clients: [taskViews] } } : {}),
					agentLoopStrategy: maxIterations(10),
				})

				return toServerSentEventsResponse(stream)
			},
		},
	},
})
