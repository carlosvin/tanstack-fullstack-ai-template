import { Modal, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { TaskForm } from '../../components/TaskForm/TaskForm'
import { processResponse } from '../../services/api/processResponse'
import { getTask, updateTask } from '../../services/api/serverFns'
import type { TaskInput } from '../../types'

export const Route = createFileRoute('/tasks/$taskId/edit')({
	loader: async ({ params }) => {
		const task = await getTask({ data: { taskId: params.taskId } })
		return { task }
	},
	component: EditTaskRoute,
})

function EditTaskRoute() {
	const { task } = Route.useLoaderData()
	const params = Route.useParams()
	const navigate = useNavigate()
	const [submitLoading, setSubmitLoading] = useState(false)

	const closeModal = () => {
		navigate({ to: '/tasks/$taskId', params: { taskId: params.taskId } })
	}

	const handleEditSubmit = async (values: TaskInput) => {
		if (!task) return
		setSubmitLoading(true)
		const result = await processResponse(() => updateTask({ data: { taskId: task.id, updates: values } }))
		setSubmitLoading(false)

		if (result.error) {
			notifications.show({ message: result.error.message, color: 'red' })
			return
		}

		notifications.show({ message: 'Task updated', color: 'green' })
		closeModal()
	}

	return (
		<Modal opened onClose={closeModal} title="Edit task">
			{task ? (
				<TaskForm initialValues={task} onSubmit={handleEditSubmit} loading={submitLoading} submitLabel="Update" />
			) : (
				<Stack>
					<Text c="dimmed">Task not found.</Text>
				</Stack>
			)}
		</Modal>
	)
}
