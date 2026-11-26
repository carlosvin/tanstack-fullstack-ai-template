import { Alert, Button, Select, Stack, Text, Title, useMantineColorScheme } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import { processResponse } from '@/services/api/processResponse'
import { updateUserPreferences } from '@/services/api/serverFns'
import type { CurrentUser } from '@/services/schemas/schemas'

const THEME_OPTIONS = [
	{ value: 'auto', label: 'System' },
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
] as const

export interface SettingsPageProps {
	currentUser: CurrentUser
	/** After a successful save (route: invalidate; modal: optional close). */
	onSaved?: () => void | Promise<void>
	/** When true (agentic Modal), omit the page Title — the Modal already titles the surface. */
	embedded?: boolean
}

/**
 * Minimal account Settings surface: identity readout + theme preference.
 * Shared by `/settings` (side / prompt-first) and the agentic Settings modal.
 */
export function SettingsPage({ currentUser, onSaved, embedded = false }: SettingsPageProps) {
	const displayName = currentUser.profile?.name || currentUser.identity.name
	const email = currentUser.identity.email
	const role = currentUser.profile?.role
	const { setColorScheme } = useMantineColorScheme()
	const initialTheme = currentUser.profile?.preferences?.theme ?? 'auto'
	const [theme, setTheme] = useState<string | null>(initialTheme)
	const [saving, setSaving] = useState(false)

	const handleSave = async () => {
		if (!theme || !email) return
		setSaving(true)
		const result = await processResponse(() =>
			updateUserPreferences({ data: { theme: theme as 'light' | 'dark' | 'auto' } }),
		)
		setSaving(false)
		if (result.error) {
			notifications.show({ color: 'red', message: result.error.message || 'Could not save preferences' })
			return
		}
		if (theme === 'auto') {
			setColorScheme('auto')
		} else if (theme === 'light' || theme === 'dark') {
			setColorScheme(theme)
		}
		notifications.show({ color: 'green', message: 'Preferences saved' })
		await onSaved?.()
	}

	return (
		<Stack gap="lg" maw={480}>
			{embedded ? (
				<Text size="sm" c="dimmed">
					Account identity and preferences for this app.
				</Text>
			) : (
				<Stack gap={4}>
					<Title order={2}>Settings</Title>
					<Text size="sm" c="dimmed">
						Account identity and preferences for this app.
					</Text>
				</Stack>
			)}

			<Stack gap="xs">
				<Text size="sm" fw={600}>
					Profile
				</Text>
				<Text size="sm">{displayName}</Text>
				{email ? (
					<Text size="sm" c="dimmed">
						{email}
					</Text>
				) : null}
				{role ? (
					<Text size="sm" c="dimmed">
						{role}
					</Text>
				) : null}
				{currentUser.roles.length > 0 ? (
					<Text size="xs" c="dimmed">
						Roles: {currentUser.roles.join(', ')}
					</Text>
				) : null}
			</Stack>

			{currentUser.isTestUser ? (
				<Alert color="gray" title="Demo identity">
					You are using an auto-generated demo identity. Saving a theme preference stores it on that identity for this
					repository session.
				</Alert>
			) : null}

			<Select
				label="Color scheme"
				description="Saved on your user profile and applied immediately."
				data={[...THEME_OPTIONS]}
				value={theme}
				onChange={setTheme}
				allowDeselect={false}
			/>

			<Button type="button" onClick={handleSave} loading={saving} disabled={!email || !theme}>
				Save preferences
			</Button>
		</Stack>
	)
}
