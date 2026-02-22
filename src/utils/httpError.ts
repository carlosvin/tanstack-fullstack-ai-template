/**
 * HTTP error class for server-side error handling.
 * Thrown by auth guards and server functions to trigger proper HTTP responses.
 */
export class HttpError extends Error {
	public readonly statusCode: number

	constructor(statusCode: number, message: string) {
		super(message)
		this.name = 'HttpError'
		this.statusCode = statusCode
	}
}
