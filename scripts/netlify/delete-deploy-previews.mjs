import { deletePullRequestPreviews } from './previewDeploys.mjs'

const result = await deletePullRequestPreviews({
	token: process.env.NETLIFY_AUTH_TOKEN,
	prNumber: process.env.PR_NUMBER,
})

if (!result.ok) {
	console.error(result.failures.join('\n'))
	process.exit(1)
}
