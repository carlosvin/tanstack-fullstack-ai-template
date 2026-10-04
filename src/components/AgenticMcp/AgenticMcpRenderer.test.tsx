import { readFileSync } from 'node:fs'
import path from 'node:path'
import { MantineProvider } from '@mantine/core'
import type { UIResourcePart } from '@tanstack/ai'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AgenticMcpRenderer, toMcpToolResult } from './AgenticMcpRenderer'

vi.mock('@tanstack/ai-react', () => ({
	useMcpAppBridge: () => ({
		callTool: vi.fn(),
		sendPrompt: vi.fn(),
		openLink: vi.fn(),
	}),
}))

vi.mock('@mcp-ui/client', () => ({
	AppRenderer: ({
		html,
		sandbox,
		toolResourceUri,
		toolResult,
	}: {
		html?: string
		sandbox: { url: URL }
		toolResourceUri?: string
		toolResult?: { structuredContent?: { tasks?: unknown } }
	}) => (
		<iframe
			title={toolResourceUri}
			src={sandbox.url.href}
			data-html={html}
			data-tasks={toolResult?.structuredContent?.tasks ? 'yes' : 'no'}
		/>
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

function renderRenderer(ui: UIResourcePart = part, toolResultText?: string) {
	return render(
		<MantineProvider>
			<AgenticMcpRenderer part={ui} toolResultText={toolResultText} onPrompt={vi.fn()} />
		</MantineProvider>,
	)
}

describe('AgenticMcpRenderer', () => {
	it('keeps guest HTML in an inner iframe instead of replacing the proxy document', () => {
		const proxy = readFileSync(path.join(process.cwd(), 'public/sandbox_proxy.html'), 'utf8')
		const relay = readFileSync(path.join(process.cwd(), 'public/sandbox_proxy.js'), 'utf8')
		expect(proxy).toContain('sandbox="allow-scripts allow-forms"')
		expect(proxy).not.toContain('allow-same-origin')
		expect(relay).toContain('ui/notifications/sandbox-resource-ready')
		expect(relay).toContain('srcdoc')
		expect(relay).not.toContain('document.write')
	})

	it('renders a registered resource and forwards the tool result', () => {
		const { container } = renderRenderer(part, JSON.stringify({ tasks: [{ id: 'a' }] }))
		const iframe = container.querySelector('iframe')
		expect(iframe?.getAttribute('src')).toContain('/sandbox_proxy.html')
		expect(iframe?.getAttribute('data-html')).toContain('Tasks')
		expect(iframe?.getAttribute('data-tasks')).toBe('yes')
	})

	it('turns tool-result JSON into structured content', () => {
		expect(toMcpToolResult(JSON.stringify({ task: { id: 'abc' } }), false).structuredContent).toEqual({
			task: { id: 'abc' },
		})
		expect(toMcpToolResult(JSON.stringify({ error: 'Task not found.', code: 404 }), false).isError).toBe(true)
	})

	it('refuses resources with a bad MIME type or URI', () => {
		renderRenderer({
			...part,
			resource: { uri: 'ui://tasks/list', mimeType: 'text/html', text: '<p>x</p>' },
		})
		expect(screen.getByText('View unavailable')).toBeTruthy()
	})
})
