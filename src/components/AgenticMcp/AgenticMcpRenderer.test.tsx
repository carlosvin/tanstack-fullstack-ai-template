import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AgenticMcpRenderer } from './AgenticMcpRenderer'

const resource = {
	uri: 'ui://tasks/list',
	mimeType: 'text/html;profile=mcp-app',
	text: '<!doctype html><html><body><p>Tasks</p></body></html>',
}

function renderRenderer(ui = resource) {
	return render(
		<MantineProvider>
			<AgenticMcpRenderer resource={ui} onPrompt={vi.fn()} />
		</MantineProvider>,
	)
}

describe('AgenticMcpRenderer', () => {
	it('renders a sandboxed iframe for valid resources', () => {
		const { container } = renderRenderer()
		const iframe = container.querySelector('iframe')
		expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts')
		expect(iframe?.getAttribute('srcDoc')).toContain('Tasks')
	})

	it('refuses resources with a bad MIME type or URI', () => {
		renderRenderer({ uri: 'ui://tasks/list', mimeType: 'text/html', text: '<p>x</p>' })
		expect(screen.getByText('View unavailable')).toBeTruthy()
	})
})
