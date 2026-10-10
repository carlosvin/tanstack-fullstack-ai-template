import { describe, expect, it } from 'vitest'
import { removeNetlifyHud, watchNetlifyHud } from './netlifyHud'

describe('netlifyHud', () => {
	it('removes the badge frame and the injected HUD script', () => {
		document.body.innerHTML = `
			<iframe id="nl-badge-frame" title="Powered by Netlify"></iframe>
			<script data-nf-variant="public" src="/.netlify/scripts/hud?variant=public"></script>
		`
		removeNetlifyHud(document)
		expect(document.getElementById('nl-badge-frame')).toBeNull()
		expect(document.querySelector('script[data-nf-variant]')).toBeNull()
	})

	it('removes a badge inserted after the watcher starts', () => {
		let onMutate: MutationCallback | undefined
		const Original = window.MutationObserver
		window.MutationObserver = class {
			constructor(callback: MutationCallback) {
				onMutate = callback
			}
			observe() {}
			disconnect() {}
			takeRecords() {
				return []
			}
		} as unknown as typeof MutationObserver

		document.body.innerHTML = ''
		const stop = watchNetlifyHud(document)
		const frame = document.createElement('iframe')
		frame.id = 'nl-hud-frame'
		document.body.append(frame)
		onMutate?.([], {} as MutationObserver)
		expect(document.getElementById('nl-hud-frame')).toBeNull()
		stop()
		window.MutationObserver = Original
	})
})
