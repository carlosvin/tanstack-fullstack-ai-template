/**
 * MCP UI view resources (rawHtml) for the agentic shell.
 *
 * Pure functions with no Node or server-only dependencies, so both the
 * server tool handlers and the client bundle may import this module.
 * Each builder escapes repository data, caps payload size, and links the
 * tool to its UI the MCP Apps way (`ui://` resource URI + `text/html;profile=mcp-app`).
 */
import type { Task } from '../schemas/schemas'
import { isAllowedMcpUiUri, MAX_MCP_UI_HTML_CHARS, MCP_APP_MIME_TYPE, type McpUiResource } from './mcpUiResource'

const MAX_TASKS_PER_VIEW = 20
const MAX_TITLE_CHARS = 200
const MAX_DESCRIPTION_CHARS = 2_000

function truncatePlain(value: string, max: number): string {
	if (value.length <= max) return value
	return `${value.slice(0, max - 1)}…`
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

function postScript(): string {
	return `<script>
function send(type, payload) {
  window.parent.postMessage({ type: type, payload: payload }, '*');
}
function askPrompt(text) { send('prompt', { text: text }); }
function openLink(url) { send('link', { url: url }); }
document.addEventListener('click', function (event) {
  var el = event.target.closest('[data-prompt], [data-link]');
  if (!el) return;
  if (el.hasAttribute('data-prompt')) askPrompt(el.getAttribute('data-prompt'));
  else if (el.hasAttribute('data-link')) openLink(el.getAttribute('data-link'));
});
</script>`
}

function shellStyle(): string {
	return `<style>
body { font-family: system-ui, sans-serif; margin: 0; padding: 12px; color: #1f2937; background: #ffffff; }
.card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; background: #ffffff; }
.badge { display: inline-block; font-size: 12px; padding: 2px 8px; border-radius: 999px; background: #eef2ff; color: #3730a3; margin-right: 6px; }
button { font: inherit; cursor: pointer; border: 1px solid #c7d2fe; background: #eef2ff; color: #3730a3; border-radius: 6px; padding: 6px 10px; }
button + button { margin-left: 6px; }
.muted { color: #6b7280; font-size: 13px; }
@media (prefers-color-scheme: dark) {
  body { color: #e5e7eb; background: #1f2937; }
  .card { border-color: #374151; background: #111827; }
  .badge { background: #312e81; color: #e0e7ff; }
  button { border-color: #4f46e5; background: #312e81; color: #e0e7ff; }
  .muted { color: #9ca3af; }
}
</style>`
}

function taskCard(task: Task, withDetailButton: boolean): string {
	const title = escapeHtml(truncatePlain(task.title, MAX_TITLE_CHARS))
	const detailButton = withDetailButton ? `<button data-prompt="Show task ${escapeHtml(task.id)}">Open</button>` : ''
	return `<div class="card"><strong>${title}</strong><div class="muted">${escapeHtml(task.id)}</div><div><span class="badge">${escapeHtml(task.status)}</span><span class="badge">${escapeHtml(task.priority)}</span>${task.assignee ? `<span class="badge">${escapeHtml(task.assignee)}</span>` : ''}</div><div style="margin-top:8px">${detailButton}</div></div>`
}

/** @internal Used by unit tests to verify the HTML size cap. */
export function assertMcpUiHtmlWithinCap(htmlString: string, uri: string): void {
	if (htmlString.length > MAX_MCP_UI_HTML_CHARS) {
		throw new Error(`MCP UI HTML exceeds ${MAX_MCP_UI_HTML_CHARS} characters for ${uri}`)
	}
}

function toResource(uri: string, htmlString: string): McpUiResource {
	if (!isAllowedMcpUiUri(uri)) {
		throw new Error(`Refusing to build MCP UI resource for non-allowlisted URI: ${uri}`)
	}
	assertMcpUiHtmlWithinCap(htmlString, uri)
	return {
		type: 'resource',
		resource: { uri, mimeType: MCP_APP_MIME_TYPE, text: htmlString },
	}
}

/** Task list view for the `showTasksView` tool. */
export function createTasksViewResource(tasks: Task[]): McpUiResource {
	const shown = tasks.slice(0, MAX_TASKS_PER_VIEW)
	const cards = shown.map((task) => taskCard(task, true)).join('')
	const overflow =
		tasks.length > shown.length
			? `<p class="muted">Showing ${shown.length} of ${tasks.length} tasks — ask for a filter to narrow down.</p>`
			: ''
	const htmlString = `<!doctype html><html><body>${shellStyle()}<h3>Tasks (${tasks.length})</h3>${cards || '<p class="muted">No tasks match.</p>'}${overflow}${postScript()}</body></html>`
	return toResource('ui://tasks/list', htmlString)
}

/** Task detail view for the `showTaskView` tool. */
export function createTaskViewResource(task: Task): McpUiResource {
	const title = escapeHtml(truncatePlain(task.title, MAX_TITLE_CHARS))
	const description = escapeHtml(truncatePlain(task.description ?? 'No description.', MAX_DESCRIPTION_CHARS))
	const htmlString = `<!doctype html><html><body>${shellStyle()}<div class="card"><h3>${title}</h3><div class="muted">${escapeHtml(task.id)}</div><p>${description}</p><div><span class="badge">${escapeHtml(task.status)}</span><span class="badge">${escapeHtml(task.priority)}</span>${task.assignee ? `<span class="badge">${escapeHtml(task.assignee)}</span>` : ''}</div><div class="muted">Created ${escapeHtml(task.createdAt)} · Updated ${escapeHtml(task.updatedAt)}</div><div style="margin-top:8px"><button data-prompt="Show my tasks">Back to tasks</button></div></div>${postScript()}</body></html>`
	return toResource(`ui://task/detail-${task.id}`, htmlString)
}
