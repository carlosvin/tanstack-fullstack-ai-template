import { expect, test } from '@playwright/test'

test.describe('Task detail', () => {
	test('shows full task details for task-1', async ({ page }) => {
		await page.goto('/tasks/task-1')

		await expect(page.getByRole('heading', { name: 'Set up project repository' })).toBeVisible()
		await expect(page.getByText('ID: task-1')).toBeVisible()
		await expect(page.getByText('Initialize the Git repository, add README, configure CI/CD pipeline.')).toBeVisible()
		await expect(page.getByText('done')).toBeVisible()
		await expect(page.getByText('high')).toBeVisible()
		await expect(page.getByText('alice@example.com')).toBeVisible()
		await expect(page.getByText(/Created:/)).toBeVisible()
		await expect(page.getByText(/Updated:/)).toBeVisible()
	})

	test('"Back to Tasks" navigates to task list', async ({ page }) => {
		await page.goto('/tasks/task-1')

		await page.getByRole('button', { name: 'Back to Tasks' }).click()
		await expect(page).toHaveURL(/\/tasks\/?$/)
	})

	test('shows "Task not found" for non-existent task', async ({ page }) => {
		await page.goto('/tasks/non-existent-id')

		await expect(page.getByRole('heading', { name: 'Task not found' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Back to Tasks' })).toBeVisible()
	})

	test('anonymous user does not see Edit/Delete buttons', async ({ page }) => {
		await page.goto('/tasks/task-1')

		await expect(page.getByRole('heading', { name: 'Set up project repository' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible()
		await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible()
	})
})
