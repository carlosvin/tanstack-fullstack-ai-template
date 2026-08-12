import { Modal, Stack, Text } from '@mantine/core'
import type { Task, TaskInput } from '../../types'
import { TaskForm } from '../TaskForm/TaskForm'

export interface EditTaskPageProps {
	task: Task | null
	loading: boolean
	onClose: () => void
	onSubmit: (values: TaskInput) => Promise<void>
}

export function EditTaskPage({ task, loading, onClose, onSubmit }: EditTaskPageProps) {
	return (
		<Modal opened onClose={onClose} title="Edit task">
			{task ? (
				<TaskForm initialValues={task} onSubmit={onSubmit} loading={loading} submitLabel="Update" />
			) : (
				<Stack>
					<Text c="dimmed">Task not found.</Text>
				</Stack>
			)}
		</Modal>
	)
}
