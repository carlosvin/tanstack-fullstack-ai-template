import { MantineProvider } from '@mantine/core'
import type { UIResourcePart } from '@tanstack/ai'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AgenticMcpRenderer } from './AgenticMcpRenderer'

vi.mock('@tanstack/ai-react/mcp-apps', () => ({
	MCPAppResource: ({ part, sandbox }: { part: UIResourcePart; sandbox: { url: URL } }) => (
		<iframe title={part.resource.uri} src={sandbox.url.href} data-html={part.resource.text} />
	),
}))

const part: UIResourcePart = {
	type: 'ui-resource',
	toolCallId: 'call-1',
	toolName: 'showTasksView',
	resource: {
		uri: 'ui://tasks/list',
		mimeType: 'text/html;profile=mcp-app',
		text: '<!doctype html><html><body><p>Tasks</p></body></html>',
	},
}

function renderRenderer(ui: UIResourcePart = part) {
	return render(
		<MantineProvider>
			<AgenticMcpRenderer part={ui} onPrompt={vi.fn()} />
		</MantineProvider>,
	)
}

describe('AgenticMcpRenderer', () => {
	it('renders a valid resource through the sandbox proxy', () => {
		const { container } = renderRenderer()
		const iframe = container.querySelector('iframe')
		expect(iframe?.getAttribute('src')).toContain('/sandbox_proxy.html')
		expect(iframe?.getAttribute('data-html')).toContain('Tasks')
	})

	it('refuses resources with a bad MIME type or URI', () => {
		renderRenderer({
			...part,
			resource: { uri: 'ui://tasks/list', mimeType: 'text/html', text: '<p>x</p>' },
		})
		expect(screen.getByText('View unavailable')).toBeTruthy()
	})
})
