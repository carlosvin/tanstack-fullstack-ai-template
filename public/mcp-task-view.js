import { App } from '/mcp-app.js'

const root = document.getElementById('root')
const MAX_TASKS = 20
const MAX_TEXT = 180

const STATUS_CLASS = {
	pending: 'status-pending',
	'in-progress': 'status-progress',
	done: 'status-done',
	cancelled: 'status-cancelled',
}

const PRIORITY_CLASS = {
	low: 'priority-low',
	medium: 'priority-medium',
	high: 'priority-high',
	critical: 'priority-critical',
}

function plain(value, max = MAX_TEXT) {
	const text = typeof value === 'string' ? value : ''
	if (text.length <= max) return text
	return `${text.slice(0, max - 1)}…`
}

function badge(text, className) {
	const span = document.createElement('span')
	span.className = className ? `badge ${className}` : 'badge'
	span.textContent = text
	return span
}

function badgesFor(task) {
	const row = document.createElement('div')
	row.className = 'badges'
	const status = plain(task?.status, 40)
	const priority = plain(task?.priority, 40)
	if (status) row.append(badge(status, STATUS_CLASS[status]))
	if (priority) row.append(badge(priority, PRIORITY_CLASS[priority]))
	if (task?.assignee) row.append(badge(plain(task.assignee)))
	return row
}

function titleEl(task) {
	const title = document.createElement('span')
	title.className = 'title'
	title.textContent = plain(task?.title, 120) || 'Untitled task'
	return title
}

function descriptionEl(task, max) {
	const description = plain(task?.description, max)
	if (!description) return null
	const p = document.createElement('span')
	p.className = 'desc'
	p.textContent = description
	return p
}

function listCard(task) {
	const id = plain(task?.id, 80)
	const box = document.createElement('button')
	box.type = 'button'
	box.className = 'card'
	if (id) box.dataset.prompt = `Show task ${id}`
	box.append(titleEl(task))
	const description = descriptionEl(task, 140)
	if (description) box.append(description)
	box.append(badgesFor(task))
	return box
}

function detailCard(task) {
	const box = document.createElement('article')
	box.className = 'card'
	box.append(titleEl(task))
	box.append(badgesFor(task))
	const description = descriptionEl(task, 2000)
	box.append(description ?? message('No description.'))
	const back = document.createElement('button')
	back.type = 'button'
	back.className = 'back'
	back.textContent = 'All tasks'
	back.dataset.prompt = 'Show my tasks'
	box.append(back)
	return box
}

function message(text) {
	const p = document.createElement('p')
	p.className = 'desc'
	p.textContent = text
	return p
}

function emptyState() {
	const box = document.createElement('div')
	box.className = 'empty'
	const title = document.createElement('div')
	title.className = 'title'
	title.textContent = 'No tasks match'
	box.append(title, message('Try another filter, or ask to see every task.'))
	return box
}

function render(data) {
	root.replaceChildren()
	if (!data || typeof data !== 'object') {
		root.append(message('This view has no data yet.'))
		return
	}
	if (typeof data.error === 'string') {
		root.append(message(data.error))
		return
	}
	if (Array.isArray(data.tasks)) {
		const shown = data.tasks.slice(0, MAX_TASKS)
		const heading = document.createElement('h2')
		heading.textContent = data.tasks.length === 1 ? '1 task' : `${data.tasks.length} tasks`
		const list = document.createElement('div')
		list.className = 'list'
		if (shown.length === 0) list.append(emptyState())
		for (const task of shown) list.append(listCard(task))
		root.append(heading, list)
		if (data.tasks.length > shown.length) {
			root.append(message(`Showing ${shown.length} of ${data.tasks.length}. Ask for a narrower filter.`))
		}
		return
	}
	if (data.task && typeof data.task === 'object') {
		root.append(detailCard(data.task))
		return
	}
	root.append(message('This view has no data yet.'))
}

function dataFromResult(result) {
	const structured = result?.structuredContent
	if (structured && typeof structured === 'object') return structured
	const blocks = Array.isArray(result?.content) ? result.content : []
	const text = blocks.find((block) => block?.type === 'text' && typeof block.text === 'string')?.text
	if (typeof text !== 'string') return null
	try {
		return JSON.parse(text)
	} catch {
		return { error: text }
	}
}

function sendPrompt(el) {
	if (!el?.dataset?.prompt) return
	app.sendMessage({ role: 'user', content: [{ type: 'text', text: el.dataset.prompt }] })
}

root.append(message('Loading view…'))

const app = new App({ name: 'task-view', version: '0.1.0' }, {})
app.ontoolresult = (result) => {
	render(dataFromResult(result))
}

app
	.connect()
	.then(() => {
		document.addEventListener('click', (event) => {
			const el = event.target?.closest?.('[data-prompt]')
			if (!el) return
			event.preventDefault()
			sendPrompt(el)
		})
	})
	.catch((error) => {
		console.error(error)
		root.replaceChildren(message('This view could not connect.'))
	})
