import { notifications } from '@mantine/notifications'
import { createFileRoute, Outlet, useLoaderData, useRouter } from '@tanstack/react-router'
import { TaskDetailPage } from '../../components/TaskDetailPage/TaskDetailPage'
import { processResponse } from '../../services/api/processResponse'
import { deleteTask, getTask } from '../../services/api/serverFns'
import { confirmDelete } from '../../utils/confirmDelete'

export const Route = createFileRoute('/tasks/$taskId')({
	staticData: {
		description: 'Task detail page; URL pattern is /tasks/<taskId> where $taskId is the concrete task id segment',
	},
	loader: async ({ params }) => {
		const task = await getTask({ data: { taskId: params.taskId } })
		return { task }
	},
	component: TaskDetailRoute,
})

function TaskDetailRoute() {
	const { task } = Route.useLoaderData()
	const { currentUser } = useLoaderData({ from: '__root__' })
	const router = useRouter()
	const isCreator = Boolean(task && currentUser?.identity?.email && task.createdBy === currentUser.identity.email)

	const handleDeleteClick = () => {
		if (!task) return
		confirmDelete(task.title, async () => {
			const taskId = task.id
			// Leave the detail route before delete + router invalidation so we do not
			// reload this loader for a task that no longer exists.
			await router.navigate({ to: '/tasks', replace: true })
			const result = await processResponse(() => deleteTask({ data: { taskId } }))
			if (result.error) {
				notifications.show({ message: result.error.message, color: 'red' })
				return
			}
			notifications.show({ message: 'Task deleted', color: 'green' })
		})
	}

	return (
		<>
			<TaskDetailPage
				task={task}
				isCreator={isCreator}
				onEdit={() => {
					if (!task) return
					router.navigate({ to: '/tasks/$taskId/edit', params: { taskId: task.id } })
				}}
				onDelete={handleDeleteClick}
			/>
			<Outlet />
		</>
	)
}
