import { notifications } from '@mantine/notifications'
import type { ProcessedResponse } from '../types'

/** Shows a success or error toast from a `processResponse` result. Returns whether the mutation succeeded. */
export function notifyProcessed<T>(result: ProcessedResponse<T>, successMessage: string): boolean {
	if (result.error) {
		notifications.show({ message: result.error.message, color: 'red' })
		return false
	}
	notifications.show({ message: successMessage, color: 'green' })
	return true
}
