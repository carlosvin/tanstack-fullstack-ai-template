import { describe, expect, it } from 'vitest'
import {
	deletePullRequestPreviews,
	deployForCommit,
	deploysForPullRequest,
	reportPreviewStatuses,
} from './previewDeploys.mjs'
import { previewUrl } from './sites.mjs'

const side = {
	name: 'fullstack-promptable-app-example',
	label: 'side',
	statusContext: 'netlify/side',
}

describe('deploysForPullRequest', () => {
	it('keeps the pull request preview and ignores production', () => {
		const deploys = [
			{ id: 'prod', context: 'production', review_id: null, ssl_url: 'https://example.netlify.app' },
			{
				id: 'preview',
				context: 'deploy-preview',
				review_id: 51,
				ssl_url: previewUrl(side.name, 51),
			},
			{
				id: 'other',
				context: 'deploy-preview',
				review_id: 50,
				ssl_url: previewUrl(side.name, 50),
			},
		]

		expect(deploysForPullRequest(deploys, 51).map((deploy) => deploy.id)).toEqual(['preview'])
	})
})

describe('deployForCommit', () => {
	it('returns the newest preview for the commit', () => {
		const older = {
			id: 'old',
			context: 'deploy-preview',
			review_id: 7,
			commit_ref: 'abc',
			created_at: '2026-10-01T00:00:00.000Z',
			state: 'error',
		}
		const newer = {
			id: 'new',
			context: 'deploy-preview',
			review_id: 7,
			commit_ref: 'abc',
			created_at: '2026-10-02T00:00:00.000Z',
			state: 'ready',
		}

		expect(deployForCommit([older, newer], 7, 'abc')?.id).toBe('new')
		expect(deployForCommit([newer], 7, 'def')).toBeNull()
	})
})

describe('reportPreviewStatuses', () => {
	it('posts a success status when the deploy for the commit is ready', async () => {
		const calls: { url: string; body?: unknown }[] = []
		const fetchImpl = async (url: string, init?: RequestInit) => {
			calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined })
			if (url.includes('/deploys')) {
				return jsonResponse([
					{
						id: 'd1',
						context: 'deploy-preview',
						review_id: 12,
						commit_ref: 'sha-1',
						state: 'ready',
						created_at: '2026-10-08T00:00:00.000Z',
						ssl_url: previewUrl(side.name, 12),
					},
				])
			}
			return jsonResponse({})
		}

		const result = await reportPreviewStatuses({
			token: 'netlify-token',
			githubToken: 'github-token',
			repository: 'carlosvin/tanstack-fullstack-ai-template',
			prNumber: '12',
			commitSha: 'sha-1',
			sites: [side],
			fetchImpl: fetchImpl as typeof fetch,
			sleep: async () => {},
			log: () => {},
		})

		expect(result.ok).toBe(true)
		const statuses = calls.filter((call) => call.url.includes('/statuses/'))
		expect(statuses.map((call) => (call.body as { state: string }).state)).toEqual(['pending', 'success'])
		expect((statuses[1].body as { context: string }).context).toBe('netlify/side')
	})
})

describe('deletePullRequestPreviews', () => {
	it('unlocks a locked preview and then deletes it', async () => {
		const methods: string[] = []
		const fetchImpl = async (url: string, init?: RequestInit) => {
			methods.push(`${init?.method ?? 'GET'} ${url}`)
			if (url.includes('/deploys?')) {
				return jsonResponse([
					{
						id: 'locked-preview',
						context: 'deploy-preview',
						review_id: 9,
						locked: true,
						ssl_url: previewUrl(side.name, 9),
					},
					{ id: 'prod', context: 'production', locked: true },
				])
			}
			return new Response(null, { status: 204 })
		}

		const result = await deletePullRequestPreviews({
			token: 'netlify-token',
			prNumber: '9',
			sites: [side],
			fetchImpl: fetchImpl as typeof fetch,
			log: () => {},
		})

		expect(result.ok).toBe(true)
		expect(methods.some((line) => line.startsWith('POST') && line.endsWith('/unlock'))).toBe(true)
		expect(methods.some((line) => line.startsWith('DELETE') && line.endsWith('/locked-preview'))).toBe(true)
		expect(methods.some((line) => line.includes('/prod'))).toBe(false)
	})
})

function jsonResponse(body: unknown) {
	return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
