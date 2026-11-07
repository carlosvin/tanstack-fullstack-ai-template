import { Button, Group, Loader, ScrollArea, Stack, Text } from '@mantine/core'
import { AgenticMessageItems } from '@/components/AgenticShell/AgenticThread'
import { usePromptChat } from '@/components/PromptChat/PromptChatContext'
import { ScrollAnchor } from '@/components/ScrollAnchor/ScrollAnchor'
import { suggestedPrompts } from '@/utils/suggestedPrompts'

interface ChatThreadProps {
	emptyHint?: string
	/** Definite viewport height for scrollable thread (prompt-first landing). */
	scrollHeight?: string | number
	maxHeight?: string | number
	showSuggestions?: boolean
}

/**
 * Shared conversation thread used by `ChatDrawer` (`side`) and `PromptFirstLanding` (`prompt-first`).
 * Renders `AgenticMessageItems` from the agentic core. Opened A2UI detail views live in
 * `PromptChatProvider` (via `useInlineDetailViews`) so they survive route remounts with the conversation.
 */
export function ChatThread({
	emptyHint = 'Ask me anything about your tasks!',
	scrollHeight,
	maxHeight,
	showSuggestions = true,
}: ChatThreadProps) {
	const { messages, isLoading, opened, handlePrompt, today } = usePromptChat()
	const last = messages.at(-1)
	const scrollSignal = [
		messages.length,
		last?.id ?? '',
		last?.parts.length ?? 0,
		opened.map((item) => `${item.id}:${item.resultText ? 1 : 0}`).join(','),
		isLoading ? '1' : '0',
	].join('|')

	return (
		<ScrollArea
			flex={scrollHeight ? undefined : 1}
			h={scrollHeight}
			mah={scrollHeight ? undefined : maxHeight}
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
				{messages.length > 0 || isLoading || opened.length > 0 ? <ScrollAnchor signal={scrollSignal} /> : null}
			</Stack>
		</ScrollArea>
	)
}
