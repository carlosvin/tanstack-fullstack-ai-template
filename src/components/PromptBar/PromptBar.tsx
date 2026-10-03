import { Box } from '@mantine/core'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { ChatComposer } from '../PromptChat/ChatComposer'

/**
 * Prompt-first shell: bottom-pinned prompt input bar.
 * Rendered in AppShell.Footer, always visible across routes.
 * Conversation state lives in PromptChatProvider on AppLayout.
 */
export function PromptBar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname })
	const navigate = useNavigate()

	const handleBeforeSubmit = () => {
		if (pathname !== '/') {
			navigate({ to: '/' })
		}
	}

	return (
		<Box component="section" aria-label="AI assistant" w="100%">
			<ChatComposer onBeforeSubmit={handleBeforeSubmit} />
		</Box>
	)
}
