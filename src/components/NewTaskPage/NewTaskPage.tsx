import { Modal } from '@mantine/core'
import { TaskForm } from '@/components/TaskForm/TaskForm'
import type { TaskInput } from '@/services/schemas/schemas'

export interface NewTaskPageProps {
	loading: boolean
	onClose: () => void
	onSubmit: (values: TaskInput) => Promise<void>
}

export function NewTaskPage({ loading, onClose, onSubmit }: NewTaskPageProps) {
	return (
		<Modal opened onClose={onClose} title="New task">
			<TaskForm onSubmit={onSubmit} loading={loading} submitLabel="Create" />
		</Modal>
	)
}
