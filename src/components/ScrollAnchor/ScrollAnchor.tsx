/**
 * Bottom-of-thread sentinel: remounts when `signal` changes and scrolls into view
 * via a callback ref — no `useEffect`.
 */
export function ScrollAnchor({ signal }: { signal: string }) {
	return (
		<div
			key={signal}
			ref={(node) => {
				if (node && typeof node.scrollIntoView === 'function') {
					node.scrollIntoView({ behavior: 'smooth', block: 'end' })
				}
			}}
			aria-hidden
		/>
	)
}
