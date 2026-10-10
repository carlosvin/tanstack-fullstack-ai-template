/**
 * Restore seed tasks the conversation already returned.
 *
 * Each serverless instance has its own in-memory seed array. The chat turn
 * replays earlier tool results so a follow-up read can find a task created
 * in another instance.
 */

import { conversationTaskState } from '../repository/conversationTasks'
import { ensureRepository } from '../repository/getRepository.server'
import { SeedRepository } from '../repository/seedRepository'

export async function rememberSeedTasks(messages: unknown): Promise<void> {
	const repository = await ensureRepository()
	if (!(repository instanceof SeedRepository)) return
	const remembered = conversationTaskState(messages)
	for (const taskId of remembered.deletedIds) repository.forgetTask(taskId)
	for (const task of remembered.tasks) repository.rememberTask(task)
}
