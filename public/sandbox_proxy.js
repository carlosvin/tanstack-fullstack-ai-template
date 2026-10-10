/**
 * MCP Apps sandbox proxy.
 *
 * `AppRenderer` loads this page and posts the resource HTML. The inner iframe
 * has no `allow-same-origin`, so the guest cannot read the host.
 */

const RESOURCE_READY = 'ui/notifications/sandbox-resource-ready'
const PROXY_READY = 'ui/notifications/sandbox-proxy-ready'
const HOST_ORIGIN = window.location.origin
const HUD_FRAME_IDS = ['nl-badge-frame', 'nl-hud-frame']

/**
 * Netlify appends `/.netlify/scripts/hud` after published HTML, including this
 * proxy. The badge then covers the last card inside the view iframe.
 */
function removeNetlifyHud() {
	for (const id of HUD_FRAME_IDS) document.getElementById(id)?.remove()
	for (const script of document.querySelectorAll('script[data-nf-variant], script[src*="/.netlify/scripts/hud"]')) {
		script.remove()
	}
}

removeNetlifyHud()
const hudObserver = new MutationObserver(removeNetlifyHud)
hudObserver.observe(document.documentElement, { childList: true, subtree: true })

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
