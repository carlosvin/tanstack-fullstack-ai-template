import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AgenticChatProvider } from '../AgenticChat/AgenticChatContext'
import { AgenticShell } from './AgenticShell'

vi.mock('./AgenticComposer', () => ({
	AgenticComposer: () => (
		<button type="button" aria-label="Send">
			Send
		</button>
	),
}))

function renderShell(aiAvailable: boolean) {
	return render(
		<MantineProvider>
			<AgenticChatProvider>
				<AgenticShell appMeta={{ name: 'TaskHub Agentic', version: '1.0.0' }} aiAvailable={aiAvailable} />
			</AgenticChatProvider>
		</MantineProvider>,
	)
}

describe('AgenticShell', () => {
	it('renders the conversation stage and pinned composer with no nav or drawer', () => {
		renderShell(true)
		expect(screen.getByText('What do you want to get done?')).toBeTruthy()
		expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy()
		expect(screen.queryByRole('button', { name: 'Toggle navigation' })).toBeNull()
		expect(screen.queryByRole('button', { name: 'Open AI chat' })).toBeNull()
	})

	it('renders an empty configuration state when AI is unavailable', () => {
		renderShell(false)
		expect(screen.getByText('AI is not configured')).toBeTruthy()
		expect(screen.queryByRole('button', { name: 'Send' })).toBeNull()
	})
})
