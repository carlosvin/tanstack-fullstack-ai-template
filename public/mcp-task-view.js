import { App } from '/mcp-app.js'

const root = document.getElementById('root')
const MAX_TASKS = 20
const MAX_TEXT = 200

function plain(value, max = MAX_TEXT) {
	const text = typeof value === 'string' ? value : ''
	if (text.length <= max) return text
	return `${text.slice(0, max - 1)}…`
}

function badge(text) {
	const span = document.createElement('span')
	span.className = 'badge'
	span.textContent = text
	return span
}

function promptButton(label, prompt) {
	const el = document.createElement('button')
	el.type = 'button'
	el.textContent = label
	el.dataset.prompt = prompt
	return el
}

function card(task, openButton) {
	const box = document.createElement('div')
	box.className = 'card'
	const title = document.createElement('strong')
	title.textContent = plain(task?.title)
	const id = document.createElement('div')
	id.className = 'muted'
	id.textContent = plain(task?.id, 80)
	const badges = document.createElement('div')
	badges.append(badge(plain(task?.status, 40)), badge(plain(task?.priority, 40)))
	if (task?.assignee) badges.append(badge(plain(task.assignee)))
	box.append(title, id, badges)
	if (openButton) {
		const actions = document.createElement('div')
		actions.style.marginTop = '8px'
		actions.append(openButton)
		box.append(actions)
	}
	return box
}

function message(text) {
	const p = document.createElement('p')
	p.className = 'muted'
	p.textContent = text
	return p
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
		const heading = document.createElement('h3')
		heading.textContent = `Tasks (${data.tasks.length})`
		root.append(heading)
		if (shown.length === 0) root.append(message('No tasks match.'))
		for (const task of shown) {
			const id = plain(task?.id, 80)
			root.append(card(task, id ? promptButton('Open', `Show task ${id}`) : null))
		}
		if (data.tasks.length > shown.length) {
			root.append(message(`Showing ${shown.length} of ${data.tasks.length} tasks — ask for a filter to narrow down.`))
		}
		return
	}
	if (data.task && typeof data.task === 'object') {
		const detail = card(data.task, null)
		const description = document.createElement('p')
		description.textContent = plain(data.task.description ?? 'No description.', 2000)
		const meta = document.createElement('div')
		meta.className = 'muted'
		meta.textContent = `Created ${plain(data.task.createdAt, 40)} · Updated ${plain(data.task.updatedAt, 40)}`
		const back = document.createElement('div')
		back.style.marginTop = '8px'
		back.append(promptButton('Back to tasks', 'Show my tasks'))
		detail.append(description, meta, back)
		root.append(detail)
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

root.append(message('Loading view…'))

const app = new App({ name: 'task-view', version: '0.1.0' }, {})
app.ontoolresult = (result) => {
	render(dataFromResult(result))
}

app
	.connect()
	.then(() => {
		document.addEventListener('click', (event) => {
			const el = event.target?.closest?.('[data-prompt], [data-link]')
			if (!el) return
			event.preventDefault()
			if (el.dataset.prompt) {
				app.sendMessage({ role: 'user', content: [{ type: 'text', text: el.dataset.prompt }] })
			} else if (el.dataset.link) {
				app.openLink({ url: el.dataset.link })
			}
		})
	})
	.catch((error) => {
		console.error(error)
	})
