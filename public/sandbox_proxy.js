/**
 * MCP Apps sandbox proxy.
 *
 * `MCPAppResource` loads this page and posts the resource HTML. The inner iframe
 * has no `allow-same-origin`, so the guest cannot read the host.
 */

const RESOURCE_READY = 'ui/notifications/sandbox-resource-ready'
const PROXY_READY = 'ui/notifications/sandbox-proxy-ready'
const HOST_ORIGIN = window.location.origin

const view = document.getElementById('mcp-view')

if (window.self === window.top || !(view instanceof HTMLIFrameElement)) {
	throw new Error('Sandbox proxy only runs inside the MCP Apps host iframe.')
}

window.addEventListener('message', (event) => {
	if (event.source === window.parent) {
		if (event.origin !== HOST_ORIGIN) return
		if (event.data?.method === RESOURCE_READY) {
			const html = event.data.params?.html
			if (typeof html === 'string') view.srcdoc = html
			return
		}
		view.contentWindow?.postMessage(event.data, '*')
		return
	}

	if (event.source === view.contentWindow) {
		window.parent.postMessage(event.data, HOST_ORIGIN)
	}
})

window.parent.postMessage({ jsonrpc: '2.0', method: PROXY_READY, params: {} }, HOST_ORIGIN)
