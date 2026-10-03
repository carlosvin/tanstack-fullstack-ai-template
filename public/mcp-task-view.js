const data = JSON.parse(document.getElementById('view-data').textContent)
const root = document.getElementById('root')

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
	title.textContent = task.title
	const id = document.createElement('div')
	id.className = 'muted'
	id.textContent = task.id
	const badges = document.createElement('div')
	badges.append(badge(task.status), badge(task.priority))
	if (task.assignee) badges.append(badge(task.assignee))
	box.append(title, id, badges)
	if (openButton) {
		const actions = document.createElement('div')
		actions.style.marginTop = '8px'
		actions.append(openButton)
		box.append(actions)
	}
	return box
}

if (data.view === 'tasks') {
	const heading = document.createElement('h3')
	heading.textContent = `Tasks (${data.total})`
	root.append(heading)
	if (data.tasks.length === 0) {
		const empty = document.createElement('p')
		empty.className = 'muted'
		empty.textContent = 'No tasks match.'
		root.append(empty)
	}
	for (const task of data.tasks) {
		root.append(card(task, promptButton('Open', `Show task ${task.id}`)))
	}
	if (data.total > data.tasks.length) {
		const overflow = document.createElement('p')
		overflow.className = 'muted'
		overflow.textContent = `Showing ${data.tasks.length} of ${data.total} tasks — ask for a filter to narrow down.`
		root.append(overflow)
	}
} else {
	const detail = card(data.task, null)
	const description = document.createElement('p')
	description.textContent = data.task.description
	const meta = document.createElement('div')
	meta.className = 'muted'
	meta.textContent = `Created ${data.task.createdAt} · Updated ${data.task.updatedAt}`
	const back = document.createElement('div')
	back.style.marginTop = '8px'
	back.append(promptButton('Back to tasks', 'Show my tasks'))
	detail.append(description, meta, back)
	root.append(detail)
}

import('/mcp-app.js')
	.then((mod) => {
		const app = new mod.App({ name: 'task-view', version: '0.1.0' }, {})
		return app.connect().then(() => {
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
	})
	.catch((error) => {
		console.error(error)
	})
