import type { UserAction } from '@a2ui-bridge/core'
import { Box, Group, Loader, ScrollArea, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import type { ToolResultPart, UIResourcePart } from '@tanstack/ai'
import type { UIMessage } from '@tanstack/ai-react'
import { Bot } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { buildTaskViewMessages, promptFromA2uiAction } from '../../services/a2ui/taskViewMessages'
import { getTask } from '../../services/api/serverFns'
import { TASK_DETAIL_UI_URI, TASKS_LIST_UI_URI } from '../../services/mcpUi/mcpUiResource'
import { AgenticA2uiSurface } from '../AgenticA2ui/AgenticA2uiSurface'
import { useAgenticChat } from '../AgenticChat/AgenticChatContext'
import { AgenticMcpRenderer } from '../AgenticMcp/AgenticMcpRenderer'
import { MessageBubble } from '../PromptChat/MessageBubble'
import { AgenticPromptMarkdownLink } from './AgenticPromptMarkdownLink'
import styles from './AgenticThread.module.css'

const AGENTIC_STARTERS = ['Show my tasks', 'Show pending tasks', 'Show high priority tasks']

const DETAIL_PROMPT = /^Open the detail view for (.+)\. The task id is ([^\s.]+)\.$/

interface OpenedDetail {
	id: string
	title: string
	taskId: string
	resultText: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function messageUiResources(message: UIMessage): UIResourcePart[] {
	const found: UIResourcePart[] = []
	for (const part of message.parts) {
		if (part.type === 'ui-resource') found.push(part)
	}
	return found
}

function toolResultText(part: ToolResultPart): string {
	if (typeof part.content === 'string') return part.content
	return part.content.map((block) => (block.type === 'text' ? block.content : '')).join('')
}

function toolContext(message: UIMessage, toolCallId: string) {
	let toolInput: Record<string, unknown> | undefined
	let resultText: string | undefined
	let toolFailed = false
	for (const part of message.parts) {
		if (part.type === 'tool-call' && part.id === toolCallId) {
			const raw = part.input
			if (isRecord(raw)) toolInput = raw
		}
		if (part.type === 'tool-result' && part.toolCallId === toolCallId) {
			resultText = toolResultText(part)
			toolFailed = part.state === 'error'
		}
	}
	return { toolInput, resultText, toolFailed }
}

const TASK_VIEW_TOOLS = new Set(['showTasksView', 'showTaskView'])

function detailRetryPrompt(input: Record<string, unknown> | undefined): string | null {
	const taskId = input && typeof input.taskId === 'string' ? input.taskId : ''
	if (!taskId || /[\s.]/.test(taskId)) return null
	return `Open the detail view for Task. The task id is ${taskId}.`
}

function taskViewResults(message: UIMessage) {
	const calls = new Map<string, { name: string; input: Record<string, unknown> | undefined }>()
	for (const part of message.parts) {
		if (part.type !== 'tool-call' || !TASK_VIEW_TOOLS.has(part.name)) continue
		calls.set(part.id, { name: part.name, input: isRecord(part.input) ? part.input : undefined })
	}
	const results: Array<{ callId: string; resultText: string; retryPrompt: string }> = []
	for (const part of message.parts) {
		if (part.type !== 'tool-result') continue
		const call = calls.get(part.toolCallId)
		if (!call) continue
		const detailRetry = call.name === 'showTaskView' ? detailRetryPrompt(call.input) : null
		results.push({
			callId: part.toolCallId,
			resultText: toolResultText(part),
			retryPrompt: detailRetry ?? 'Show my tasks',
		})
	}
	return results
}

function retryPrompt(uri: string, toolInput: Record<string, unknown> | undefined): string {
	if (uri === TASKS_LIST_UI_URI) return 'Show my tasks'
	if (uri === TASK_DETAIL_UI_URI) {
		const id =
			toolInput && typeof toolInput.taskId === 'string'
				? toolInput.taskId
				: toolInput && typeof toolInput.id === 'string'
					? toolInput.id
					: ''
		if (id) return `Show task ${id}`
	}
	return 'Please show that view again'
}

/**
 * Conversation stage for the agentic shell: assistant markdown, Mantine A2UI
 * task views, and any raw MCP UI document. Text-only results stay markdown.
 */
export function AgenticThread({ scrollHeight }: { scrollHeight?: string | number }) {
	const { messages, isLoading, sendMessage } = useAgenticChat()
	const [opened, setOpened] = useState<OpenedDetail[]>([])
	const viewportRef = useRef<HTMLDivElement>(null)

	function handlePrompt(text: string) {
		const match = DETAIL_PROMPT.exec(text)
		if (!match?.[2]) {
			sendMessage(text)
			return
		}
		const title = match[1] || 'Task'
		const taskId = match[2]
		const id = crypto.randomUUID()
		setOpened((prev) => [...prev, { id, title, taskId, resultText: '' }])
		void getTask({ data: { taskId } }).then((task) => {
			const resultText = JSON.stringify(task ? { task } : { error: 'Task not found.', code: 404 })
			setOpened((prev) => prev.map((item) => (item.id === id ? { ...item, resultText } : item)))
		})
	}

	function handleAction(action: UserAction) {
		const prompt = promptFromA2uiAction(action)
		if (prompt) handlePrompt(prompt)
	}

	useEffect(() => {
		if (messages.length === 0) setOpened([])
	}, [messages.length])

	useEffect(() => {
		const el = viewportRef.current
		if (!el || typeof el.scrollTo !== 'function') return
		if (messages.length === 0 && !isLoading) return
		el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
	}, [messages, isLoading])

	const isEmpty = messages.length === 0

	return (
		<ScrollArea h={scrollHeight} viewportRef={viewportRef} type="auto" classNames={{ content: styles.content }}>
			<Box className={`${styles.stage} ${isEmpty ? styles.empty : ''}`}>
				<Stack gap="md" p="xs" w="100%">
					{isEmpty && (
						<Stack className={styles.hero} align="center" gap="lg" py="xl">
							<ThemeIcon size={64} radius="xl" variant="light" color="teal">
								<Bot size={32} />
							</ThemeIcon>
							<Stack align="center" gap={4}>
								<Title order={2} ta="center">
									What should we look at?
								</Title>
								<Text c="dimmed" ta="center" size="sm" maw={440}>
									Ask for a list, a filter, or one task. The view shows up here.
								</Text>
							</Stack>
							<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" w="100%">
								{AGENTIC_STARTERS.map((prompt) => (
									<button key={prompt} type="button" className={styles.starter} onClick={() => handlePrompt(prompt)}>
										<Text component="span" size="sm" fw={500}>
											{prompt}
										</Text>
									</button>
								))}
							</SimpleGrid>
						</Stack>
					)}
					{messages.map((msg) => {
						const resources = msg.role === 'user' ? [] : messageUiResources(msg)
						const views = msg.role === 'user' ? [] : taskViewResults(msg)
						return (
							<Stack key={msg.id} gap="sm">
								<MessageBubble
									message={msg}
									markdownLinkComponent={(props) => <AgenticPromptMarkdownLink {...props} onPrompt={handlePrompt} />}
								/>
								{views.map((view) => (
									<TaskViewResult
										key={view.callId}
										resultText={view.resultText}
										onAction={handleAction}
										onRetry={() => handlePrompt(view.retryPrompt)}
									/>
								))}
								{resources.map((part) => {
									const context = toolContext(msg, part.toolCallId)
									return (
										<AgenticMcpRenderer
											key={`${part.toolCallId}-${part.resource.uri}`}
											part={part}
											toolInput={context.toolInput}
											toolResultText={context.resultText}
											toolFailed={context.toolFailed}
											onPrompt={handlePrompt}
											onRetry={() => handlePrompt(retryPrompt(part.resource.uri, context.toolInput))}
										/>
									)
								})}
							</Stack>
						)
					})}
					{opened.map((item) => {
						const userMessage: UIMessage = {
							id: item.id,
							role: 'user',
							parts: [{ type: 'text', content: item.title }],
						}
						return (
							<Stack key={item.id} gap="sm">
								<MessageBubble message={userMessage} />
								{item.resultText ? (
									<TaskViewResult
										resultText={item.resultText}
										onAction={handleAction}
										onRetry={() =>
											handlePrompt(`Open the detail view for ${item.title}. The task id is ${item.taskId}.`)
										}
									/>
								) : (
									<Group gap="xs">
										<Loader size="xs" />
										<Text size="xs" c="dimmed">
											Opening {item.title}
										</Text>
									</Group>
								)}
							</Stack>
						)
					})}
					{isLoading && messages[messages.length - 1]?.role === 'user' && (
						<Group gap="xs">
							<Loader size="xs" />
							<Text size="xs" c="dimmed">
								Thinking...
							</Text>
						</Group>
					)}
				</Stack>
			</Box>
		</ScrollArea>
	)
}

function TaskViewResult({
	resultText,
	onAction,
	onRetry,
}: {
	resultText: string
	onAction: (action: UserAction) => void
	onRetry: () => void
}) {
	const messages = useMemo(() => buildTaskViewMessages(resultText), [resultText])
	return <AgenticA2uiSurface messages={messages} onAction={onAction} onRetry={onRetry} />
}
