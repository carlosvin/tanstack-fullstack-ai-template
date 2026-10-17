import { notifications } from '@mantine/notifications'
import { createFileRoute, Outlet, useLoaderData, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { TasksPage } from '../../components/TasksPage/TasksPage'
import { processResponse } from '../../services/api/processResponse'
import { deleteTask, getAssigneeOptions, getTasks, updateTasksStatus } from '../../services/api/serverFns'
import { TasksListSearchSchema } from '../../services/schemas/schemas'
import type { Task } from '../../types'
import { confirmDelete } from '../../utils/confirmDelete'
import { notifyProcessed } from '../../utils/notifyProcessed'
import { useCalendarToday } from '../../utils/useCalendarToday'

export const Route = createFileRoute('/tasks/')({
	staticData: { description: 'Tasks list with optional filters' },
	validateSearch: TasksListSearchSchema,
	loaderDeps: ({ search }) => ({
		status: search.status,
		priority: search.priority,
		assignee: search.assignee,
		search: search.search,
		due: search.due,
		asOf: search.asOf,
		dueOnOrBefore: search.dueOnOrBefore,
		sort: search.sort,
	}),
	loader: async ({ deps }) => {
		const [tasks, assignees] = await Promise.all([getTasks({ data: deps }), getAssigneeOptions()])
		return { tasks, assignees }
	},
	component: TasksRoute,
})

function TasksRoute() {
	const { tasks, assignees } = Route.useLoaderData()
	const { currentUser } = useLoaderData({ from: '__root__' })
	const search = Route.useSearch()
	const navigate = useNavigate()
	const today = useCalendarToday()
	const [bulkLoading, setBulkLoading] = useState(false)
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
				assignees={assignees}
				search={search}
				isAuth={isAuth}
				isTestUser={Boolean(currentUser?.isTestUser)}
				today={today}
				currentUserEmail={currentUser?.identity?.email}
				bulkLoading={bulkLoading}
				onUpdateSearch={(updates, replace = false) => {
					navigate({
						to: '/tasks',
						replace,
						search: (prev) => TasksListSearchSchema.parse({ ...prev, ...updates }),
					})
				}}
				onDeleteTask={handleDeleteClick}
				onBulkStatus={(status) => {
					const taskIds = search.selected ?? []
					if (taskIds.length === 0) return
					setBulkLoading(true)
					void processResponse(() => updateTasksStatus({ data: { taskIds, status } })).then((result) => {
						setBulkLoading(false)
						if (result.error || !result.data) {
							notifyProcessed(result, 'Tasks updated')
							return
						}
						const { updated, refused } = result.data
						const message =
							refused.length > 0
								? `Updated ${updated.length}. Left unchanged: ${refused.map((row) => row.title ?? row.taskId).join(', ')}.`
								: `Updated ${updated.length === 1 ? '1 task' : `${updated.length} tasks`}.`
						notifications.show({ message, color: refused.length > 0 && updated.length === 0 ? 'yellow' : 'green' })
						navigate({
							to: '/tasks',
							replace: true,
							search: (prev) => TasksListSearchSchema.parse({ ...prev, selected: undefined }),
						})
					})
				}}
			/>
			<Outlet />
		</>
	)
}
