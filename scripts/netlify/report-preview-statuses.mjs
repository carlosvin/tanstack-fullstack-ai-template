import { reportPreviewStatuses } from './previewDeploys.mjs'

const result = await reportPreviewStatuses({
	token: process.env.NETLIFY_AUTH_TOKEN,
	githubToken: process.env.GITHUB_TOKEN,
	repository: process.env.GITHUB_REPOSITORY,
	prNumber: process.env.PR_NUMBER,
	commitSha: process.env.COMMIT_SHA,
})

if (!result.ok) {
	console.error(result.failures.join('\n'))
	process.exit(1)
}
