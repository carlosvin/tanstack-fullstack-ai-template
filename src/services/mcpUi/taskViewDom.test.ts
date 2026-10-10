import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

const guestSource = readFileSync(path.join(process.cwd(), 'public/mcp-task-view.js'), 'utf8')
	.replace(
		"import { App } from '/mcp-app.js'",
		`class App {
			connect() { return Promise.resolve() }
			sendSizeChanged() {}
			sendMessage() {}
			getHostContext() { return { theme: 'light' } }
		}`,
	)
	.replaceAll('export function', 'function')

const loadGuest = new Function(
	'document',
	'window',
	'requestAnimationFrame',
	'ResizeObserver',
	`${guestSource}\nreturn { renderTaskView, promptTarget }`,
)

const { renderTaskView, promptTarget } = loadGuest(document, window, requestAnimationFrame, window.ResizeObserver) as {
	renderTaskView: (data: unknown) => void
	promptTarget: (node: EventTarget | null) => HTMLElement | null
}

const tasks = [
	{
		id: 'task-1',
		title: 'Set up project repository',
		description: 'Initialize the Git repository.',
		status: 'done',
		priority: 'high',
		assignee: 'alice@example.com',
	},
	{
		id: 'task-2',
		title: 'Design database schema',
		description: 'Define collections and indexes.',
		status: 'in-progress',
		priority: 'medium',
		assignee: 'bob@example.com',
	},
]

describe('task view presentations', () => {
	beforeEach(() => {
		document.body.innerHTML = '<div id="root"></div><div id="live"></div>'
	})

	it('renders a card grid by default, with each card as a button', () => {
		renderTaskView({ tasks })
		const root = document.getElementById('root')
		expect(root?.querySelector('table')).toBeNull()
		const cards = root?.querySelectorAll('ul.list button')
		expect(cards).toHaveLength(2)
		expect(cards?.[0]?.getAttribute('aria-label')).toBe(
			'Set up project repository, done, high priority, assigned to alice@example.com',
		)
		expect(cards?.[0]?.getAttribute('data-prompt')).toContain('The task id is task-1')
	})

	it('renders a table whose title button is the control, including clicks on another cell', () => {
		renderTaskView({ tasks, presentation: 'table' })
		const root = document.getElementById('root')
		expect(root?.querySelector('ul.list')).toBeNull()
		const rows = root?.querySelectorAll('tbody tr')
		expect(rows).toHaveLength(2)
		expect(rows?.[0]?.hasAttribute('tabindex')).toBe(false)
		const button = rows?.[0]?.querySelector('button.row-open')
		expect(button?.getAttribute('aria-label')).toContain('high priority')
		expect(button?.textContent).toBe('Set up project repository')

		const description = rows?.[0]?.querySelectorAll('td')[0] ?? null
		expect(promptTarget(description)?.getAttribute('data-prompt')).toContain('The task id is task-1')
		expect(promptTarget(button ?? null)).toBe(button)
	})
})
