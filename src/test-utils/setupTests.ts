import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/dom'

afterEach(cleanup)

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	}),
})

window.ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
}

window.MutationObserver = class {
	observe() {}
	disconnect() {}
	takeRecords() {
		return []
	}
}
