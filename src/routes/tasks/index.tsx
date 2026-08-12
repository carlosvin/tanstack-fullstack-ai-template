import { createFileRoute, Outlet, useLoaderData, useNavigate } from '@tanstack/react-router'
import { TasksPage } from '../../components/TasksPage/TasksPage'
import { processResponse } from '../../services/api/processResponse'
import { deleteTask, getTasks } from '../../services/api/serverFns'
import { TasksListSearchSchema } from '../../services/schemas/schemas'
import type { Task } from '../../types'
import { confirmDelete } from '../../utils/confirmDelete'
import { notifyProcessed } from '../../utils/notifyProcessed'

export const Route = createFileRoute('/tasks/')({
	staticData: { description: 'Tasks list with optional filters' },
	validateSearch: TasksListSearchSchema,
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
				notifyProcessed(result, 'Task deleted')
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
				onDeleteTask={handleDeleteClick}
			/>
			<Outlet />
		</>
	)
}
