/** Frame ids created by Netlify's injected `/.netlify/scripts/hud` badge. */
export const NETLIFY_HUD_FRAME_IDS = ['nl-badge-frame', 'nl-hud-frame'] as const

/**
 * Remove the Netlify HUD badge from a document.
 * Netlify appends the script after `</html>` on published HTML, including the
 * MCP sandbox proxy, so the badge paints over the last task card.
 */
export function removeNetlifyHud(doc: Document) {
	for (const id of NETLIFY_HUD_FRAME_IDS) {
		doc.getElementById(id)?.remove()
	}
	for (const script of doc.querySelectorAll('script[data-nf-variant], script[src*="/.netlify/scripts/hud"]')) {
		script.remove()
	}
}

/** Drop the badge now and again if the HUD script inserts it later. */
export function watchNetlifyHud(doc: Document): () => void {
	removeNetlifyHud(doc)
	const root = doc.documentElement
	if (!root) return () => {}
	const observer = new MutationObserver(() => removeNetlifyHud(doc))
	observer.observe(root, { childList: true, subtree: true })
	return () => observer.disconnect()
}
