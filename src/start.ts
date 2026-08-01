import { createStart } from '@tanstack/react-start'
import { webEnvMiddleware } from './middleware/webEnv'

/** Global request middleware: auth + startup-validated env/app meta on context. */
export const startInstance = createStart(() => ({
	requestMiddleware: [webEnvMiddleware],
}))
