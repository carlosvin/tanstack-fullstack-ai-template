import { modals } from '@mantine/modals'

/** Opens a Mantine confirm modal before destructive delete actions. */
export function confirmDelete(itemLabel: string, onConfirm: () => void | Promise<void>) {
	modals.openConfirmModal({
		title: 'Delete task',
		centered: true,
		children: `Delete "${itemLabel}"? This action cannot be undone.`,
		labels: { confirm: 'Delete', cancel: 'Cancel' },
		confirmProps: { color: 'red' },
		onConfirm,
	})
}
