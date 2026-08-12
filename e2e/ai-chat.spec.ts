import { expect, test } from '@playwright/test'

function sseEvent(chunk: Record<string, unknown>): string {
	return `data: ${JSON.stringify({ timestamp: Date.now(), ...chunk })}\n\n`
}

function assistantSse(text: string): string {
	return [
		sseEvent({ type: 'RUN_STARTED', runId: 'run-1' }),
		sseEvent({ type: 'TEXT_MESSAGE_START', messageId: 'a1', role: 'assistant' }),
		sseEvent({ type: 'TEXT_MESSAGE_CONTENT', messageId: 'a1', delta: text }),
		sseEvent({ type: 'TEXT_MESSAGE_END', messageId: 'a1' }),
		sseEvent({ type: 'RUN_FINISHED', runId: 'run-1', finishReason: 'stop' }),
		'data: [DONE]\n\n',
	].join('')
}

function errorSse(message: string): string {
	return [
		sseEvent({ type: 'RUN_STARTED', runId: 'run-err' }),
		sseEvent({ type: 'RUN_ERROR', runId: 'run-err', error: { message, code: 'invalid_api_key' } }),
		'data: [DONE]\n\n',
	].join('')
}

async function mockChatSse(page: import('@playwright/test').Page, body: string) {
	await page.route('**/api/chat', async (route) => {
		if (route.request().method() === 'GET') {
			await route.fulfill({ json: { available: true } })
			return
		}
		await route.fulfill({
			status: 200,
			headers: {
				'content-type': 'text/event-stream',
				'cache-control': 'no-cache',
				connection: 'keep-alive',
			},
			body,
		})
	})
}

test.describe('AI chat', () => {
	test('GET /api/chat reports availability without crashing', async ({ request }) => {
		const response = await request.get('/api/chat')
		expect(response.ok()).toBeTruthy()
		const payload = (await response.json()) as { available: boolean }
		expect(payload).toEqual({ available: expect.any(Boolean) })
	})

	test('Ask AI opens the drawer, streams a reply, and follows markdown links', async ({ page }) => {
		await mockChatSse(
			page,
			assistantSse('Here are the [in-progress tasks](/tasks?status=in-progress) and [task one](/tasks/task-1).'),
		)

		await page.goto('/')
		await expect(page.getByRole('button', { name: 'Open AI chat' })).toBeVisible()
		await page.getByRole('button', { name: 'Open AI chat' }).click()

		const dialog = page.getByRole('dialog')
		await expect(dialog.getByText('Ask me anything about your tasks!')).toBeVisible()

		await dialog.getByPlaceholder('Type a message...').fill('Show in-progress tasks')
		await dialog.getByRole('button', { name: 'Send' }).click()

		await expect(dialog.getByText('Show in-progress tasks')).toBeVisible()
		await expect(dialog.getByRole('link', { name: 'in-progress tasks' })).toBeVisible()
		await expect(dialog.getByRole('link', { name: 'task one' })).toBeVisible()

		await dialog.getByRole('link', { name: 'in-progress tasks' }).click()
		await expect(page).toHaveURL(/\/tasks\?status=in-progress/)
		await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
	})

	test('shows a stream error instead of hanging', async ({ page }) => {
		await mockChatSse(page, errorSse('Incorrect API key provided'))

		await page.goto('/')
		await page.getByRole('button', { name: 'Open AI chat' }).click()

		const dialog = page.getByRole('dialog')
		await dialog.getByPlaceholder('Type a message...').fill('hello')
		await dialog.getByRole('button', { name: 'Send' }).click()

		await expect(dialog.getByRole('alert')).toContainText('Incorrect API key provided')
	})
})
