import { conversationTaskState } from '../repository/conversationTasks'
import { ensureRepository } from '../repository/getRepository.server'
import { SeedRepository } from '../repository/seedRepository'

export async function applySeedConversation(repository: SeedRepository, messages: unknown): Promise<void> {
	const remembered = conversationTaskState(messages)
	for (const taskId of remembered.deletedIds) await repository.deleteTask(taskId)
	for (const task of remembered.tasks) repository.rememberTask(task)
}

export async function rememberSeedTasks(messages: unknown): Promise<void> {
	const repository = await ensureRepository()
	if (!(repository instanceof SeedRepository)) return
	await applySeedConversation(repository, messages)
}
