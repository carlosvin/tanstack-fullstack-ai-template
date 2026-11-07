import type { UserAction } from '@a2ui-bridge/core'
import { Box, Group, Loader, ScrollArea, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import type { ToolResultPart } from '@tanstack/ai'
import type { UIMessage } from '@tanstack/ai-react'
import { Bot } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AgenticA2uiSurface } from '@/components/AgenticA2ui/AgenticA2uiSurface'
import { useAgenticChat } from '@/components/AgenticChat/AgenticChatContext'
import { AgenticPromptMarkdownLink } from '@/components/AgenticShell/AgenticPromptMarkdownLink'
import styles from '@/components/AgenticShell/AgenticThread.module.css'
import { MessageBubble } from '@/components/PromptChat/MessageBubble'
import { ScrollAnchor } from '@/components/ScrollAnchor/ScrollAnchor'
import {
	buildTaskViewMessages,
	bulkStatusPrompt,
	promptFromA2uiAction,
	taskViewIntent,
} from '@/services/a2ui/taskViewMessages'
import { getTask } from '@/services/api/serverFns'
import { findRememberedTask } from '@/services/repository/conversationTasks'
import { useCalendarToday } from '@/utils/useCalendarToday'

const AGENTIC_STARTERS = ['Show my tasks', 'Show pending tasks', 'Show overdue tasks']

const DETAIL_PROMPT = /^Open the detail view for (.+)\. The task id is ([^\s.]+)\.$/

export interface OpenedDetail {
	id: string
	title: string
	taskId: string
	resultText: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toolResultText(part: ToolResultPart): string {
	if (typeof part.content === 'string') return part.content
	return part.content.map((block) => (block.type === 'text' ? block.content : '')).join('')
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

export function TaskViewResult({
	resultText,
	asOf,
	onPrompt,
	onRetry,
}: {
	resultText: string
	asOf: string
	onPrompt: (text: string) => void
	onRetry: () => void
}) {
	const [selected, setSelected] = useState<string[]>([])
	const messages = useMemo(() => buildTaskViewMessages(resultText, selected, asOf), [resultText, selected, asOf])

	function onAction(action: UserAction) {
		const prompt = promptFromA2uiAction(action)
		if (prompt) {
			onPrompt(prompt)
			return
		}
		const intent = taskViewIntent(action)
		if (intent.kind === 'toggle') {
			setSelected((current) =>
				current.includes(intent.taskId) ? current.filter((id) => id !== intent.taskId) : [...current, intent.taskId],
			)
			return
		}
		if (intent.kind === 'mark-selected') {
			const next = bulkStatusPrompt(resultText, selected, intent.status)
			if (next) onPrompt(next)
		}
	}

	return <AgenticA2uiSurface messages={messages} onAction={onAction} onRetry={onRetry} />
}

/**
 * Shared hook for opening an inline task detail view from an A2UI card/row action
 * without sending an extra model turn. Used across all 3 chat panels (`agentic`, `prompt-first`, and `side`).
 */
export function useInlineDetailViews(messages: UIMessage[], sendMessage: (text: string) => void, today: string) {
	const [opened, setOpened] = useState<OpenedDetail[]>([])
	const hasMessages = messages.length > 0
	const [hadMessages, setHadMessages] = useState(hasMessages)
	if (hasMessages !== hadMessages) {
		setHadMessages(hasMessages)
		if (!hasMessages) setOpened([])
	}

	function handlePrompt(text: string) {
		const match = DETAIL_PROMPT.exec(text)
		if (!match?.[2]) {
			sendMessage(text)
			return
		}
		const title = match[1] || 'Task'
		const taskId = match[2]
		const remembered = findRememberedTask(messages, taskId)
		const id = crypto.randomUUID()
		setOpened((prev) => [
			...(messages.length === 0 ? [] : prev),
			{ id, title, taskId, resultText: remembered ? JSON.stringify({ task: remembered, asOf: today }) : '' },
		])
		if (remembered) return
		void getTask({ data: { taskId } }).then((task) => {
			const resultText = JSON.stringify(task ? { task, asOf: today } : { error: 'Task not found.', code: 404 })
			setOpened((prev) => prev.map((item) => (item.id === id ? { ...item, resultText } : item)))
		})
	}

	return { opened, handlePrompt }
}

/**
 * Shared dynamic message list: renders each message's markdown bubble, inline A2UI task views,
 * and any inline detail views opened directly from cards.
 * Reused by `AgenticThread` (`agentic`), `PromptFirstLanding` (`prompt-first`), and `ChatDrawer` (`side`).
 */
export function AgenticMessageItems({
	messages,
	opened,
	today,
	onPrompt,
	markdownLinkComponent,
}: {
	messages: UIMessage[]
	opened: OpenedDetail[]
	today: string
	onPrompt: (text: string) => void
	markdownLinkComponent?: React.ComponentType<{ href?: string; children?: React.ReactNode }>
}) {
	return (
		<>
			{messages.map((msg) => {
				const views = msg.role === 'user' ? [] : taskViewResults(msg)
				return (
					<Stack key={msg.id} gap="sm">
						<MessageBubble message={msg} markdownLinkComponent={markdownLinkComponent} />
						{views.map((view) => (
							<TaskViewResult
								key={view.callId}
								resultText={view.resultText}
								asOf={today}
								onPrompt={onPrompt}
								onRetry={() => onPrompt(view.retryPrompt)}
							/>
						))}
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
						<MessageBubble message={userMessage} markdownLinkComponent={markdownLinkComponent} />
						{item.resultText ? (
							<TaskViewResult
								resultText={item.resultText}
								asOf={today}
								onPrompt={onPrompt}
								onRetry={() => onPrompt(`Open the detail view for ${item.title}. The task id is ${item.taskId}.`)}
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
		</>
	)
}

/**
 * Conversation stage for the agentic shell: assistant markdown and Mantine A2UI
 * task views. Text-only results stay markdown.
 */
export function AgenticThread({ scrollHeight }: { scrollHeight?: string | number }) {
	const { messages, isLoading, sendMessage } = useAgenticChat()
	const today = useCalendarToday()
	const { opened, handlePrompt } = useInlineDetailViews(messages, sendMessage, today)
	const last = messages.at(-1)
	const scrollSignal = [
		messages.length,
		last?.id ?? '',
		last?.parts.length ?? 0,
		opened.map((item) => `${item.id}:${item.resultText ? 1 : 0}`).join(','),
		isLoading ? '1' : '0',
	].join('|')

	const isEmpty = messages.length === 0

	return (
		<ScrollArea h={scrollHeight} type="auto" classNames={{ content: styles.content }}>
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
					<AgenticMessageItems
						messages={messages}
						opened={opened}
						today={today}
						onPrompt={handlePrompt}
						markdownLinkComponent={(props) => <AgenticPromptMarkdownLink {...props} onPrompt={handlePrompt} />}
					/>
					{isLoading && messages[messages.length - 1]?.role === 'user' && (
						<Group gap="xs">
							<Loader size="xs" />
							<Text size="xs" c="dimmed">
								Thinking...
							</Text>
						</Group>
					)}
					{!isEmpty || isLoading || opened.length > 0 ? <ScrollAnchor signal={scrollSignal} /> : null}
				</Stack>
			</Box>
		</ScrollArea>
	)
}
