import { Avatar, Menu, Text, UnstyledButton } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import type { CurrentUser } from '@/services/schemas/schemas'

export interface UserMenuProps {
	currentUser: CurrentUser
	/** When set (agentic), Settings opens this callback instead of navigating to `/settings`. */
	onOpenSettings?: () => void
}

function initialsFrom(name: string, email: string): string {
	const source = name.trim() || email.trim()
	if (!source) return '?'
	const parts = source.split(/[\s@._-]+/).filter(Boolean)
	if (parts.length >= 2) {
		return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
	}
	return source.slice(0, 2).toUpperCase()
}

/**
 * Industry-standard User Menu (account menu): avatar trigger in the app-bar
 * utility area opens an account-only dropdown (identity → Settings).
 */
export function UserMenu({ currentUser, onOpenSettings }: UserMenuProps) {
	const navigate = useNavigate()
	const displayName = currentUser.profile?.name || currentUser.identity.name
	const email = currentUser.identity.email
	const avatarUrl = currentUser.profile?.avatarUrl
	const initials = initialsFrom(displayName, email)

	const openSettings = () => {
		if (onOpenSettings) {
			onOpenSettings()
			return
		}
		void navigate({ to: '/settings' })
	}

	return (
		<Menu shadow="md" width={260} position="bottom-end" withinPortal>
			<Menu.Target>
				<UnstyledButton
					type="button"
					aria-label="Open user menu"
					style={{ display: 'inline-flex', borderRadius: '50%' }}
				>
					<Avatar src={avatarUrl} alt={displayName} radius="xl" size={32} color="blue">
						{initials}
					</Avatar>
				</UnstyledButton>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Label>
					<Text size="sm" fw={600} truncate>
						{displayName}
					</Text>
					{email ? (
						<Text size="xs" c="dimmed" truncate>
							{email}
						</Text>
					) : null}
					{currentUser.isTestUser ? (
						<Text size="xs" c="dimmed">
							Demo identity
						</Text>
					) : null}
				</Menu.Label>
				<Menu.Divider />
				<Menu.Item leftSection={<Settings size={16} />} onClick={openSettings}>
					Settings
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	)
}
