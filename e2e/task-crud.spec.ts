import { expect, test } from './auth'

test.describe('Task CRUD (authenticated as Alice)', () => {
	test.describe.configure({ mode: 'serial' })

	test('shows Add task button and edit/delete icons for own tasks', async ({ authedPage: page }) => {
		await page.goto('/tasks', { waitUntil: 'networkidle' })

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

	test('creates a new task', async ({ authedPage: page }) => {
		await page.goto('/tasks/new', { waitUntil: 'networkidle' })

		await expect(page.getByRole('dialog')).toBeVisible()

		await page.getByRole('textbox', { name: 'Title' }).fill('E2E Test Task')
		await page.getByRole('textbox', { name: 'Description' }).fill('Created by Playwright E2E test')

		await page.getByRole('textbox', { name: 'Priority' }).click()
		await page.getByRole('option', { name: 'high' }).click()

		await page.getByRole('button', { name: 'Create' }).click()

		await expect(page.getByText('Task created')).toBeVisible({ timeout: 10_000 })
		await page.waitForURL(/\/tasks\/?$/, { timeout: 10_000 })
		await expect(page.getByText('E2E Test Task').first()).toBeVisible()
	})

	test('edits an existing task', async ({ authedPage: page }) => {
		await page.goto('/tasks/task-1/edit', { waitUntil: 'networkidle' })

		await expect(page.getByRole('dialog')).toBeVisible()

		const titleInput = page.getByRole('textbox', { name: 'Title' })
		await titleInput.clear()
		await titleInput.fill('Set up project repository (updated)')

		await page.getByRole('button', { name: 'Update' }).click()

		await expect(page.getByText('Task updated')).toBeVisible({ timeout: 10_000 })
		await expect(page.getByText('Set up project repository (updated)')).toBeVisible()
	})

	test('deletes the created task from detail page', async ({ authedPage: page }) => {
		await page.goto('/tasks', { waitUntil: 'networkidle' })

		await page.getByText('E2E Test Task').first().click()
		await page.waitForURL(/\/tasks\/task-/, { timeout: 10_000 })
		await page.waitForLoadState('networkidle')

		await page.evaluate(() => {
			window.confirm = () => true
		})

		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(page.getByText('Task deleted')).toBeVisible({ timeout: 10_000 })
		await page.waitForURL(/\/tasks\/?$/, { timeout: 10_000 })
	})

	test('shows Edit/Delete on detail page for own task', async ({ authedPage: page }) => {
		await page.goto('/tasks/task-1', { waitUntil: 'networkidle' })

		await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible()
		await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()
	})

	test('hides Edit/Delete on detail page for non-owned task', async ({ authedPage: page }) => {
		await page.goto('/tasks/task-3', { waitUntil: 'networkidle' })

		await expect(page.getByRole('heading', { name: 'Implement authentication' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible()
		await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible()
	})
})
