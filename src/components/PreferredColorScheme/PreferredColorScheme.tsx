import { useMantineColorScheme } from '@mantine/core'
import { useEffect } from 'react'

export type PreferredTheme = 'light' | 'dark' | 'auto'

/**
 * Applies the signed-in profile's saved theme into Mantine whenever loader data changes
 * (initial load, router invalidate after Settings / AI preference tools).
 */
export function PreferredColorScheme({ theme }: { theme?: PreferredTheme | null }) {
	const { setColorScheme } = useMantineColorScheme()
	const next = theme ?? 'auto'

	useEffect(() => {
		setColorScheme(next)
	}, [next, setColorScheme])

	return null
}
