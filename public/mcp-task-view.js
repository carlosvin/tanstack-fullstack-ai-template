import { App } from '/mcp-app.js'

const root = document.getElementById('root')
const live = document.getElementById('live')
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

let connected = false
let lastHeight = 0

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

function taskLabel(task) {
	const title = plain(task?.title, 120) || 'Untitled task'
	const status = plain(task?.status, 40)
	const priority = plain(task?.priority, 40)
	const assignee = task?.assignee ? plain(task.assignee) : ''
	const parts = [title]
	if (status) parts.push(status)
	if (priority) parts.push(`${priority} priority`)
	if (assignee) parts.push(`assigned to ${assignee}`)
	return parts.join(', ')
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
	const title = plain(task?.title, 80) || 'this task'
	if (id) box.dataset.prompt = `Open the detail view for ${title}. The task id is ${id}.`
	box.setAttribute('aria-label', taskLabel(task))
	box.append(titleEl(task))
	const description = descriptionEl(task, 140)
	if (description) box.append(description)
	box.append(badgesFor(task))
	return box
}

function detailCard(task) {
	const box = document.createElement('article')
	box.className = 'card detail'
	box.append(titleEl(task))
	box.append(badgesFor(task))
	const description = descriptionEl(task, 2000)
	box.append(description ?? message('No description.'))
	const back = document.createElement('button')
	back.type = 'button'
	back.className = 'back'
	back.textContent = 'All tasks'
	back.setAttribute('aria-label', 'All tasks')
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

function announce(text) {
	if (!live) return
	live.textContent = ''
	live.textContent = text
}

function textCell(value) {
	const cell = document.createElement('td')
	cell.textContent = plain(value, 80)
	return cell
}

function badgeCell(value, className) {
	const cell = document.createElement('td')
	const label = plain(value, 40)
	if (label) cell.append(badge(label, className))
	return cell
}

function taskRow(task) {
	const row = document.createElement('tr')
	const id = plain(task?.id, 80)
	const title = plain(task?.title, 80) || 'this task'
	if (id) {
		row.dataset.prompt = `Open the detail view for ${title}. The task id is ${id}.`
		row.tabIndex = 0
		row.setAttribute('aria-label', taskLabel(task))
	}
	const titleCell = document.createElement('th')
	titleCell.scope = 'row'
	titleCell.textContent = plain(task?.title, 120) || 'Untitled task'
	row.append(
		titleCell,
		textCell(task?.description),
		badgeCell(task?.status, STATUS_CLASS[plain(task?.status, 40)]),
		badgeCell(task?.priority, PRIORITY_CLASS[plain(task?.priority, 40)]),
		textCell(task?.assignee),
	)
	return row
}

function taskTable(tasks, countLabel) {
	const wrap = document.createElement('div')
	wrap.className = 'table-wrap'
	const table = document.createElement('table')
	table.className = 'tasks'
	const caption = document.createElement('caption')
	caption.textContent = countLabel
	const head = document.createElement('thead')
	const headRow = document.createElement('tr')
	for (const label of ['Task', 'Description', 'Status', 'Priority', 'Assignee']) {
		const cell = document.createElement('th')
		cell.scope = 'col'
		cell.textContent = label
		headRow.append(cell)
	}
	head.append(headRow)
	const body = document.createElement('tbody')
	for (const task of tasks) body.append(taskRow(task))
	table.append(caption, head, body)
	wrap.append(table)
	return wrap
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

function reportHeight() {
	if (!connected) return
	const doc = document.documentElement
	const previous = doc.style.height
	doc.style.height = 'max-content'
	const height = Math.ceil(doc.getBoundingClientRect().height)
	doc.style.height = previous
	if (height > 0 && Math.abs(height - lastHeight) >= 2) {
		lastHeight = height
		app.sendSizeChanged({ height })
	}
}

function scheduleHeight() {
	requestAnimationFrame(() => reportHeight())
}

function render(data) {
	root.replaceChildren()
	if (!data || typeof data !== 'object') {
		root.append(message('This view has no data yet.'))
		announce('This view has no data yet.')
		scheduleHeight()
		return
	}
	if (typeof data.error === 'string') {
		root.append(message(data.error))
		announce(data.error)
		scheduleHeight()
		return
	}
	if (Array.isArray(data.tasks)) {
		const shown = data.tasks.slice(0, MAX_TASKS)
		const heading = document.createElement('h2')
		const countLabel = data.tasks.length === 1 ? '1 task' : `${data.tasks.length} tasks`
		heading.textContent = countLabel
		if (shown.length === 0) {
			root.append(heading, emptyState())
		} else if (data.presentation === 'table') {
			root.append(taskTable(shown, countLabel))
		} else {
			const list = document.createElement('ul')
			list.className = 'list'
			list.setAttribute('aria-label', 'Tasks')
			for (const task of shown) {
				const item = document.createElement('li')
				item.append(listCard(task))
				list.append(item)
			}
			root.append(heading, list)
		}
		let announcement = shown.length === 0 ? 'No tasks match' : countLabel
		if (data.tasks.length > shown.length) {
			const more = `Showing ${shown.length} of ${data.tasks.length}. Ask for a narrower filter.`
			root.append(message(more))
			announcement = `${countLabel}. ${more}`
		}
		announce(announcement)
		scheduleHeight()
		return
	}
	if (data.task && typeof data.task === 'object') {
		root.append(detailCard(data.task))
		announce(taskLabel(data.task))
		scheduleHeight()
		return
	}
	root.append(message('This view has no data yet.'))
	announce('This view has no data yet.')
	scheduleHeight()
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

function themeName(value) {
	const theme = value && typeof value === 'object' ? value.theme : undefined
	return theme === 'light' || theme === 'dark' ? theme : null
}

function applyTheme(value) {
	const theme = themeName(value)
	if (!theme) return
	document.documentElement.style.colorScheme = theme
	scheduleHeight()
}

function sendPrompt(el) {
	if (!el?.dataset?.prompt) return
	app.sendMessage({ role: 'user', content: [{ type: 'text', text: el.dataset.prompt }] })
}

root.append(message('Loading view…'))

const app = new App({ name: 'task-view', version: '0.1.0' }, {}, { autoResize: false })
app.ontoolresult = (result) => {
	render(dataFromResult(result))
}
app.onhostcontextchanged = (ctx) => {
	applyTheme(ctx)
}

app
	.connect()
	.then(() => {
		connected = true
		applyTheme(app.getHostContext())
		scheduleHeight()
		const observer = new ResizeObserver(() => reportHeight())
		observer.observe(document.body)
		document.addEventListener('click', (event) => {
			const el = event.target?.closest?.('[data-prompt]')
			if (!el) return
			event.preventDefault()
			sendPrompt(el)
		})
		document.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ') return
			const el = event.target?.closest?.('[data-prompt]')
			if (!el || el.tagName === 'BUTTON') return
			event.preventDefault()
			sendPrompt(el)
		})
	})
	.catch((error) => {
		console.error(error)
		root.replaceChildren(message('This view could not connect.'))
		announce('This view could not connect.')
	})
