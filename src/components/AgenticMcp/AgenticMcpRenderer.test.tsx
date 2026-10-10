import { readFileSync } from 'node:fs'
import path from 'node:path'
import { MantineProvider } from '@mantine/core'
import type { UIResourcePart } from '@tanstack/ai'
import { render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AgenticMcpRenderer, mcpFrameTitle, toMcpToolResult } from './AgenticMcpRenderer'

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
		hostContext,
		onSizeChanged,
	}: {
		html?: string
		sandbox: { url: URL }
		toolResourceUri?: string
		toolResult?: { structuredContent?: { tasks?: unknown } }
		hostContext?: { theme?: string }
		onSizeChanged?: (size: { width?: number; height?: number }) => void
	}) => {
		useEffect(() => {
			const iframe = document.querySelector('iframe')
			if (iframe instanceof HTMLIFrameElement) iframe.style.width = '320px'
			onSizeChanged?.({ width: 320, height: 400 })
		}, [onSizeChanged])
		return (
			<iframe
				title={toolResourceUri}
				src={sandbox.url.href}
				data-html={html}
				data-theme={hostContext?.theme}
				data-tasks={toolResult?.structuredContent?.tasks ? 'yes' : 'no'}
			/>
		)
	},
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
		expect(proxy).toContain('title="Task view"')
		expect(proxy).not.toContain('allow-same-origin')
		expect(relay).toContain('nl-badge-frame')
		expect(relay).toContain('ui/notifications/sandbox-resource-ready')
		expect(relay).toContain('srcdoc')
		expect(relay).not.toContain('document.write')
	})

	it('renders a registered resource and forwards the tool result', () => {
		const { container } = render(
			<MantineProvider defaultColorScheme="dark">
				<AgenticMcpRenderer part={part} toolResultText={JSON.stringify({ tasks: [{ id: 'a' }] })} onPrompt={vi.fn()} />
			</MantineProvider>,
		)
		const iframe = container.querySelector('iframe')
		expect(iframe?.getAttribute('src')).toContain('/sandbox_proxy.html')
		expect(iframe?.getAttribute('data-html')).toContain('Tasks')
		expect(iframe?.getAttribute('data-tasks')).toBe('yes')
		expect(iframe?.getAttribute('data-theme')).toBe('dark')
		expect(iframe?.title).toBe('Task list')
		expect(iframe?.style.width).toBe('100%')
	})

	it('names the host frame from the resource', () => {
		expect(mcpFrameTitle('ui://tasks/list')).toBe('Task list')
		expect(mcpFrameTitle('ui://task/detail')).toBe('Task')
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
