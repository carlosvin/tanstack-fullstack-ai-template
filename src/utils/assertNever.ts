/** Exhaustive-switch helper — the `default` branch should be unreachable. */
export function assertNever(value: never): never {
	throw new Error(`Unexpected value: ${String(value)}`)
}
