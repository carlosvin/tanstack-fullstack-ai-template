import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { NewTaskPage } from '../../components/NewTaskPage/NewTaskPage'
import { processResponse } from '../../services/api/processResponse'
import { createTask } from '../../services/api/serverFns'
import type { TaskInput } from '../../types'
import { notifyProcessed } from '../../utils/notifyProcessed'

export const Route = createFileRoute('/tasks/new')({
	staticData: { description: 'Create task modal route over the tasks list page' },
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

		if (!notifyProcessed(result, 'Task created')) return
		closeModal()
	}

	return <NewTaskPage loading={submitLoading} onClose={closeModal} onSubmit={handleCreateSubmit} />
}
