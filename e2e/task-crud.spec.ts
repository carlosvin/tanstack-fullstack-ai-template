import { expect, test } from './auth'
import { selectMantineOption } from './helpers'

const runId = Date.now()
const CREATED_TASK_TITLE = `E2E CRUD ${runId}`
const UPDATED_TASK_TITLE = `${CREATED_TASK_TITLE} (updated)`

test.describe('Task CRUD (authenticated as Alice)', () => {
	test.describe.configure({ mode: 'serial' })

	test('shows Add task button and edit/delete icons for own tasks', async ({ authedPage: page }) => {
		await page.goto('/tasks')
		await expect(page.getByRole('button', { name: 'Add task' })).toBeVisible()

		const task1Card = page.locator('[class*="Card"]').filter({ hasText: 'Set up project repository' })
		await expect(task1Card.getByLabel('Edit task')).toBeVisible()
		await expect(task1Card.getByLabel('Delete task')).toBeVisible()

		const task3Card = page.locator('[class*="Card"]').filter({ hasText: 'Implement authentication' })
		await expect(task3Card.getByLabel('Edit task')).not.toBeVisible()
		await expect(task3Card.getByLabel('Delete task')).not.toBeVisible()

		const task5Card = page.locator('[class*="Card"]').filter({ hasText: 'Add dark mode support' })
		await expect(task5Card.getByLabel('Edit task')).not.toBeVisible()
		await expect(task5Card.getByLabel('Delete task')).not.toBeVisible()
	})

	test('creates, edits, and deletes a task with all fields', async ({ authedPage: page }) => {
		await page.goto('/tasks/new')
		await expect(page.getByRole('dialog')).toBeVisible()

		await page.getByRole('textbox', { name: 'Title' }).fill(CREATED_TASK_TITLE)
		await page.getByRole('textbox', { name: 'Description' }).fill('Created by Playwright E2E test')
		await selectMantineOption(page, 'Status', 'in-progress')
		await selectMantineOption(page, 'Priority', 'high')
		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText('Task created')).toBeVisible({ timeout: 10_000 })
		await page.waitForURL(/\/tasks\/?$/, { timeout: 10_000 })

		const createdCard = page.locator('[class*="Card"]').filter({ hasText: CREATED_TASK_TITLE }).first()
		await expect(createdCard.getByText('high', { exact: true })).toBeVisible()
		await expect(createdCard.getByText('in-progress', { exact: true })).toBeVisible()

		await page.getByText(CREATED_TASK_TITLE).first().click()
		await page.waitForURL(/\/tasks\/task-/, { timeout: 10_000 })

		const taskId = page.url().match(/\/tasks\/([^/?#]+)/)?.[1]
		expect(taskId).toBeTruthy()
		await page.goto(`/tasks/${taskId}/edit`)
		await expect(page.getByRole('dialog')).toBeVisible()

		const titleInput = page.getByRole('textbox', { name: 'Title' })
		await titleInput.clear()
		await titleInput.fill(UPDATED_TASK_TITLE)

		const descriptionInput = page.getByRole('textbox', { name: 'Description' })
		await descriptionInput.clear()
		await descriptionInput.fill('Updated description from E2E')

		await selectMantineOption(page, 'Status', 'done')
		await selectMantineOption(page, 'Priority', 'critical')
		await page.getByRole('button', { name: 'Update' }).click()

		await expect(page.getByText('Task updated')).toBeVisible({ timeout: 10_000 })
		await expect(page.getByRole('dialog')).not.toBeVisible()

		const detailCard = page.locator('[class*="Card"]').filter({ hasText: UPDATED_TASK_TITLE }).first()
		await expect(page.getByRole('heading', { name: UPDATED_TASK_TITLE })).toBeVisible()
		await expect(detailCard.getByText('Updated description from E2E')).toBeVisible()
		await expect(detailCard.getByText('done', { exact: true })).toBeVisible()
		await expect(detailCard.getByText('critical', { exact: true })).toBeVisible()

		await page.evaluate(() => {
			window.confirm = () => true
		})
		await page.locator('main').getByRole('button', { name: 'Delete', exact: true }).click()
		await page.waitForURL(/\/tasks\/?$/, { timeout: 10_000 })
		await expect(page.getByText(UPDATED_TASK_TITLE)).not.toBeVisible()
	})

	test('shows Edit/Delete on detail page for own task', async ({ authedPage: page }) => {
		await page.goto('/tasks/task-1')

		await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible()
		await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()
	})

	test('hides Edit/Delete on detail page for non-owned task', async ({ authedPage: page }) => {
		await page.goto('/tasks/task-3')

		await expect(page.getByRole('heading', { name: 'Implement authentication' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible()
		await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible()
	})
})
