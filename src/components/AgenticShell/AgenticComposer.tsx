import { ActionIcon, Alert, Group, Stack, Textarea, Tooltip } from '@mantine/core'
import { Send, Square, Trash2 } from 'lucide-react'
import { friendlyChatError } from '../../utils/chatError'
import { useAgenticChat } from '../AgenticChat/AgenticChatContext'

/** Bottom-pinned composer for the agentic shell: Enter sends, Shift+Enter newline. */
export function AgenticComposer() {
	const { input, setInput, handleSubmit, isLoading, error, stop, clear, messages } = useAgenticChat()

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSubmit()
		}
	}

	return (
		<Stack gap="xs" w="100%">
			{error ? (
				<Alert color="red" variant="light" p="xs" role="alert">
					{friendlyChatError(error)}
				</Alert>
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
					placeholder="Ask in plain language..."
					value={input}
					onChange={(e) => setInput(e.currentTarget.value)}
					onKeyDown={handleKeyDown}
					autosize
					minRows={1}
					maxRows={4}
					aria-label="Agent message"
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
		</Stack>
	)
}
