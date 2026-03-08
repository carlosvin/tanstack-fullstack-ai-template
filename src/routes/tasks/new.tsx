import { Modal } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { TaskForm } from '../../components/TaskForm/TaskForm'
import { processResponse } from '../../services/api/processResponse'
import { createTask } from '../../services/api/serverFns'
import type { TaskInput } from '../../types'

export const Route = createFileRoute('/tasks/new')({
	component: NewTaskRoute,
})

function NewTaskRoute() {
	const navigate = useNavigate()
	const [submitLoading, setSubmitLoading] = useState(false)

	const closeModal = () => {
		navigate({ to: '/tasks' })
	}

	const handleCreateSubmit = async (values: TaskInput) => {
		setSubmitLoading(true)
		const result = await processResponse(() => createTask({ data: values }))
		setSubmitLoading(false)

		if (result.error) {
			notifications.show({ message: result.error.message, color: 'red' })
			return
		}

		notifications.show({ message: 'Task created', color: 'green' })
		closeModal()
	}

	return (
		<Modal opened onClose={closeModal} title="New task">
			<TaskForm onSubmit={handleCreateSubmit} loading={submitLoading} submitLabel="Create" />
		</Modal>
	)
}
