import { Button, Group, Loader, ScrollArea, Stack, Text } from '@mantine/core'
import { useCallback, useEffect, useRef } from 'react'
import { AgenticMessageItems, useInlineDetailViews } from '@/components/AgenticShell/AgenticThread'
import { usePromptChat } from '@/components/PromptChat/PromptChatContext'
import { suggestedPrompts } from '@/utils/suggestedPrompts'
import { useCalendarToday } from '@/utils/useCalendarToday'

interface ChatThreadProps {
	emptyHint?: string
	/** Definite viewport height for scrollable thread (prompt-first landing). */
	scrollHeight?: string | number
	maxHeight?: string | number
	viewportRef?: React.RefObject<HTMLDivElement | null>
	showSuggestions?: boolean
}

/**
 * Shared conversation thread used by `ChatDrawer` (`side`) and `PromptFirstLanding` (`prompt-first`).
 * Reuses `AgenticMessageItems` and `useInlineDetailViews` from `AgenticThread` so every AI panel renders
 * dynamic A2UI surfaces (`AgenticA2uiSurface`) and sandboxed MCP UI resources (`AgenticMcpRenderer`),
 * while keeping client-side route `MarkdownLink` navigation.
 */
export function ChatThread({
	emptyHint = 'Ask me anything about your tasks!',
	scrollHeight,
	maxHeight,
	viewportRef: externalViewportRef,
	showSuggestions = true,
}: ChatThreadProps) {
	const { messages, isLoading, sendMessage } = usePromptChat()
	const today = useCalendarToday()
	const { opened, handlePrompt } = useInlineDetailViews(messages, sendMessage, today)
	const internalViewport = useRef<HTMLDivElement>(null)
	const viewportRef = externalViewportRef ?? internalViewport

	const scrollToBottom = useCallback(() => {
		const el = viewportRef.current
		if (el && typeof el.scrollTo === 'function') {
			el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
		}
	}, [viewportRef])

	useEffect(() => {
		scrollToBottom()
	}, [scrollToBottom])

	return (
		<ScrollArea
			flex={scrollHeight ? undefined : 1}
			h={scrollHeight}
			mah={scrollHeight ? undefined : maxHeight}
			viewportRef={viewportRef}
			type="auto"
		>
			<Stack gap="md" p="xs">
				{messages.length === 0 && (
					<Stack gap="sm" py="md">
						<Text c="dimmed" ta="center" size="sm">
							{emptyHint}
						</Text>
						{showSuggestions && suggestedPrompts.length > 0 ? (
							<Group gap="xs" justify="center">
								{suggestedPrompts.map((prompt) => (
									<Button key={prompt} variant="light" size="compact-sm" onClick={() => handlePrompt(prompt)}>
										{prompt}
									</Button>
								))}
							</Group>
						) : null}
					</Stack>
				)}
				<AgenticMessageItems messages={messages} opened={opened} today={today} onPrompt={handlePrompt} />
				{isLoading && messages[messages.length - 1]?.role === 'user' && (
					<Group gap="xs">
						<Loader size="xs" />
						<Text size="xs" c="dimmed">
							Thinking...
						</Text>
					</Group>
				)}
			</Stack>
		</ScrollArea>
	)
}
