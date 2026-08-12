import { createFileRoute, getRouteApi, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { EditTaskPage } from '../../components/EditTaskPage/EditTaskPage'
import { processResponse } from '../../services/api/processResponse'
import { updateTask } from '../../services/api/serverFns'
import type { TaskInput } from '../../types'
import { notifyProcessed } from '../../utils/notifyProcessed'

const parentRoute = getRouteApi('/tasks/$taskId')

export const Route = createFileRoute('/tasks/$taskId/edit')({
	staticData: { description: 'Edit task modal route over the task detail page' },
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

		if (!notifyProcessed(result, 'Task updated')) return
		closeModal()
	}

	return <EditTaskPage task={task} loading={submitLoading} onClose={closeModal} onSubmit={handleEditSubmit} />
}
