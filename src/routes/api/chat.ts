import { chat, convertMessagesToModelMessages, maxIterations, toServerSentEventsResponse } from '@tanstack/ai'
import { createFileRoute } from '@tanstack/react-router'
import { getAIAdapter, getMissingAIConfigMessage, isAIConfigured } from '../../services/ai/adapter'
import { getAssigneesTool, getTasksTool, getTaskTool } from '../../services/ai/tools'
import { getObservability } from '../../services/observability'
import { getReadRepository } from '../../services/repository/getRepository'
import { BrowserContextSchema } from '../../services/schemas/schemas'
import type { BrowserContext, UserIdentity, UserProfile } from '../../types'
import { extractIdentityFromJwt } from '../../utils/jwt'

const AUTH_HEADER_NAME = process.env.AUTH_HEADER_NAME ?? 'Authorization'

const BASE_SYSTEM_PROMPT = `You are a helpful task management assistant. You have access to tools that let you query the task database.

## Capabilities
- Search and filter tasks by status, priority, assignee, or free text
- Get detailed information about specific tasks
- List all assignees

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

## Guidelines
- Use the getTasks tool with filters when the user asks about tasks matching criteria.
- Use the getTask tool when the user asks about a specific task.
- Use getAssignees to discover team members.
- Format responses clearly using markdown.
- When listing tasks, include their status and priority.
- Be concise but thorough.`

function buildSystemPrompt(
	user: UserIdentity,
	profile: UserProfile | null,
	browserContext: BrowserContext | null,
): string {
	const sections: string[] = [BASE_SYSTEM_PROMPT]

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
	}

	return sections.join('\n')
}

export const Route = createFileRoute('/api/chat')({
	server: {
		handlers: {
			GET: () => {
				return Response.json({ available: isAIConfigured() })
			},
			POST: async ({ request }) => {
				const adapter = getAIAdapter()

				if (!adapter) {
					const message = getMissingAIConfigMessage() ?? 'AI chat is not configured'
					console.error(`[ai] ${message}`)
					getObservability().captureError(new Error(message))
					return Response.json({ error: message }, { status: 503 })
				}

				const body = await request.json()

				const authHeader = request.headers.get(AUTH_HEADER_NAME)
				const identity = extractIdentityFromJwt(authHeader)
				const user: UserIdentity = identity.email ? identity : { email: '', name: 'Anonymous', groups: [] }

				let profile: UserProfile | null = null
				if (user.email) {
					const repo = getReadRepository()
					profile = await repo.getUserProfile(user.email)
				}

				const browserContextResult = BrowserContextSchema.safeParse(body.browserContext)
				const browserContext: BrowserContext | null = browserContextResult.success ? browserContextResult.data : null

				const systemPrompt = buildSystemPrompt(user, profile, browserContext)

				const stream = chat({
					adapter,
					messages: convertMessagesToModelMessages(body.messages ?? []) as any,
					systemPrompts: [systemPrompt],
					tools: [getTasksTool, getTaskTool, getAssigneesTool],
					agentLoopStrategy: maxIterations(10),
				})

				return toServerSentEventsResponse(stream)
			},
		},
	},
})
