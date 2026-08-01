import { Modal, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { createFileRoute, getRouteApi, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { TaskForm } from '../../components/TaskForm/TaskForm'
import { processResponse } from '../../services/api/processResponse'
import { updateTask } from '../../services/api/serverFns'
import type { TaskInput } from '../../types'

const parentRoute = getRouteApi('/tasks/$taskId')

export const Route = createFileRoute('/tasks/$taskId/edit')({
	component: EditTaskRoute,
})

function EditTaskRoute() {
	const { task } = parentRoute.useLoaderData()
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
