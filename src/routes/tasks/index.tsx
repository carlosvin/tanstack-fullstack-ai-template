import { notifications } from '@mantine/notifications'
import { createFileRoute, Outlet, useLoaderData, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { TasksPage } from '../../components/TasksPage/TasksPage'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../constants/options'
import { processResponse } from '../../services/api/processResponse'
import { deleteTask, getTasks } from '../../services/api/serverFns'
import type { Task } from '../../types'
import { confirmDelete } from '../../utils/confirmDelete'

const TasksSearchSchema = z.object({
	status: z.enum(TASK_STATUSES).optional().describe('Filter by status: pending | in-progress | done | cancelled'),
	priority: z.enum(TASK_PRIORITIES).optional().describe('Filter by priority: low | medium | high | critical'),
	search: z.string().optional().describe('Full-text search over tasks'),
})

export const Route = createFileRoute('/tasks/')({
	staticData: { description: 'Tasks list with optional filters' },
	validateSearch: TasksSearchSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ deps }) => {
		const tasks = await getTasks({ data: deps })
		return { tasks }
	},
	component: TasksRoute,
})

function TasksRoute() {
	const { tasks } = Route.useLoaderData()
	const { currentUser } = useLoaderData({ from: '__root__' })
	const search = Route.useSearch()
	const navigate = useNavigate()
	const isAuth = Boolean(currentUser?.identity?.email)

	const handleDeleteClick = (task: Task) => {
		confirmDelete(task.title, () =>
			processResponse(() => deleteTask({ data: { taskId: task.id } })).then((result) => {
				if (result.error) {
					notifications.show({ message: result.error.message, color: 'red' })
					return
				}
				notifications.show({ message: 'Task deleted', color: 'green' })
			}),
		)
	}

	return (
		<>
			<TasksPage
				tasks={tasks}
				search={search}
				isAuth={isAuth}
				currentUserEmail={currentUser?.identity?.email}
				onUpdateSearch={(updates, replace = false) => {
					navigate({
						to: '/tasks',
						replace,
						search: (prev) => ({ ...prev, ...updates }),
					})
				}}
				onAddTask={() => navigate({ to: '/tasks/new' })}
				onEditTask={(taskId) => navigate({ to: '/tasks/$taskId/edit', params: { taskId } })}
				onDeleteTask={handleDeleteClick}
			/>
			<Outlet />
		</>
	)
}
