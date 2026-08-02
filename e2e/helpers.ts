import type { Page } from '@playwright/test'

/** Open a Mantine Select (combobox) by field label and choose an option. */
export async function selectMantineOption(page: Page, fieldLabel: string, optionLabel: string) {
	await page.getByRole('combobox', { name: fieldLabel }).click()
	await page.getByRole('option', { name: optionLabel }).click()
}
