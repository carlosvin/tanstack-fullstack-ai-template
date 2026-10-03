import { ActionIcon, Group, Stack, Text, Textarea, Tooltip } from '@mantine/core'
import { Send, Square, Trash2 } from 'lucide-react'
import { usePromptChat } from './PromptChatContext'

interface ChatComposerProps {
	/** Runs after the message is submitted (e.g. navigate home) so browser context is captured first. */
	onAfterSubmit?: () => void
}

export function ChatComposer({ onAfterSubmit }: ChatComposerProps = {}) {
	const { input, setInput, handleSubmit, isLoading, error, stop, clear, messages } = usePromptChat()

	const onSubmit = () => {
		if (!input.trim() || isLoading) return
		handleSubmit()
		onAfterSubmit?.()
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			onSubmit()
		}
	}

	return (
		<Stack gap="xs" w="100%">
			{error ? (
				<Text size="sm" c="red" role="alert">
					{error.message}
				</Text>
			) : null}
			<Group gap="xs" align="flex-end" wrap="nowrap">
				{messages.length > 0 && (
					<Tooltip label="Clear conversation">
						<ActionIcon variant="subtle" color="gray" onClick={clear} size="lg" aria-label="Clear conversation">
							<Trash2 size={18} />
						</ActionIcon>
					</Tooltip>
				)}
				<Textarea
					flex={1}
					placeholder="Type a message..."
					value={input}
					onChange={(e) => setInput(e.currentTarget.value)}
					onKeyDown={handleKeyDown}
					autosize
					minRows={1}
					maxRows={4}
					aria-label="Chat message"
				/>
				{isLoading ? (
					<Tooltip label="Stop generating">
						<ActionIcon variant="subtle" onClick={stop} size="lg" aria-label="Stop generating">
							<Square size={18} />
						</ActionIcon>
					</Tooltip>
				) : (
					<Tooltip label="Send">
						<ActionIcon variant="filled" onClick={onSubmit} disabled={!input.trim()} size="lg" aria-label="Send">
							<Send size={18} />
						</ActionIcon>
					</Tooltip>
				)}
			</Group>
		</Stack>
	)
}
