import { ActionIcon, Group, Stack, Text, Textarea, Tooltip } from '@mantine/core'
import { Send, Square, Trash2 } from 'lucide-react'
import { usePromptChat } from './PromptChatContext'

export function ChatComposer() {
	const { input, setInput, handleSubmit, handleKeyDown, isLoading, error, stop, clear, messages } = usePromptChat()

	return (
		<Stack gap="xs">
			{error ? (
				<Text size="sm" c="red" role="alert">
					{error.message}
				</Text>
			) : null}
			<Group gap="xs" align="flex-end">
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
						<ActionIcon variant="filled" onClick={handleSubmit} disabled={!input.trim()} size="lg" aria-label="Send">
							<Send size={18} />
						</ActionIcon>
					</Tooltip>
				)}
			</Group>
			{messages.length > 0 && (
				<Tooltip label="Clear conversation">
					<ActionIcon variant="subtle" color="gray" onClick={clear} size="sm" ml="auto" aria-label="Clear conversation">
						<Trash2 size={14} />
					</ActionIcon>
				</Tooltip>
			)}
		</Stack>
	)
}
