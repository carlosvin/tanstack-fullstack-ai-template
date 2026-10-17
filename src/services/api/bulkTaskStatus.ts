import { HttpError } from '../../utils/httpError'
import type { AccessTicket } from '../auth/accessTicket'
import { updateWriteTrace } from '../repository/traceability'
import type { Repository } from '../repository/types'
import { type BulkTaskStatusInput, type BulkTaskStatusResult, BulkTaskStatusResultSchema } from '../schemas/schemas'
import { toToolTask } from '../schemas/taskMappers'

/** Set one status on many tasks. Each row is accepted only for its creator. */
export async function applyBulkStatus(
	repository: Repository,
	ticket: AccessTicket,
	input: BulkTaskStatusInput,
): Promise<BulkTaskStatusResult> {
	const updated: BulkTaskStatusResult['updated'] = []
	const refused: BulkTaskStatusResult['refused'] = []
	const trace = updateWriteTrace(ticket.identity.email)

	for (const taskId of new Set(input.taskIds)) {
		const task = await repository.getTask(taskId)
		if (!task) {
			refused.push({ taskId, reason: 'Task not found' })
			continue
		}
		try {
			ticket.requireTaskCreator(task)
		} catch (error) {
			refused.push({
				taskId,
				title: task.title,
				reason: error instanceof HttpError ? error.message : 'Only the task creator can change this task',
			})
			continue
		}
		const row = await repository.updateTask(taskId, { status: input.status }, trace)
		if (!row) {
			refused.push({ taskId, title: task.title, reason: 'Task not found' })
			continue
		}
		updated.push(toToolTask(row))
	}

	return BulkTaskStatusResultSchema.parse({ updated, refused })
}
