import { NETLIFY_SITES, previewUrl } from './sites.mjs'

const NETLIFY_API = 'https://api.netlify.com/api/v1'
const GITHUB_API = 'https://api.github.com'

export function deploysForPullRequest(deploys, prNumber) {
	const pr = Number(prNumber)
	const marker = `deploy-preview-${pr}--`
	return deploys.filter((deploy) => {
		if (deploy.context && deploy.context !== 'deploy-preview') return false
		if (Number(deploy.review_id) === pr) return true
		return deployUrls(deploy).some((url) => url.includes(marker))
	})
}

export function latestDeploy(deploys) {
	return [...deploys].sort((a, b) => Date.parse(b.created_at ?? 0) - Date.parse(a.created_at ?? 0))[0] ?? null
}

export function deployForCommit(deploys, prNumber, commitRef) {
	const matches = deploysForPullRequest(deploys, prNumber).filter((deploy) => deploy.commit_ref === commitRef)
	return latestDeploy(matches)
}

export function classifyDeployState(state) {
	if (state === 'ready') return 'success'
	if (state === 'error') return 'failure'
	return 'pending'
}

export function statusTargetUrl(deploy, siteName, prNumber) {
	const outcome = classifyDeployState(deploy?.state)
	if (outcome === 'failure' && deploy?.admin_url) return deploy.admin_url
	const alias = deployUrls(deploy).find((url) => url.includes(`deploy-preview-${prNumber}--`))
	return alias ?? previewUrl(siteName, prNumber)
}

export function statusDescription(site, deploy) {
	const outcome = classifyDeployState(deploy?.state)
	if (outcome === 'success') return `${site.label} preview is ready`
	if (outcome === 'failure') {
		const detail = deploy?.error_message ? `: ${deploy.error_message}` : ''
		return truncate(`${site.label} preview failed${detail}`, 140)
	}
	return `Building ${site.label} preview`
}

export async function reportPreviewStatuses({
	token,
	githubToken,
	repository,
	prNumber,
	commitSha,
	timeoutMs = 12 * 60 * 1000,
	pollMs = 15_000,
	fetchImpl = fetch,
	sleep = defaultSleep,
	now = Date.now,
	sites = NETLIFY_SITES,
	log = console.log,
}) {
	requireToken(token)
	const deadline = now() + timeoutMs
	const failures = []

	for (const site of sites) {
		await postStatus({
			fetchImpl,
			githubToken,
			repository,
			commitSha,
			context: site.statusContext,
			state: 'pending',
			description: `Building ${site.label} preview`,
			targetUrl: previewUrl(site.name, prNumber),
		})
	}

	/** @type {Map<string, { state: string, description: string, targetUrl: string }>} */
	const settled = new Map()

	while (settled.size < sites.length) {
		for (const site of sites) {
			if (settled.has(site.name)) continue
			const deploys = await listDeploys(fetchImpl, token, site.name)
			const deploy = deployForCommit(deploys, prNumber, commitSha)
			const state = classifyDeployState(deploy?.state)
			if (!deploy || state === 'pending') {
				log(`${site.label}: waiting for deploy of ${commitSha.slice(0, 7)}`)
				continue
			}
			const description = statusDescription(site, deploy)
			const targetUrl = statusTargetUrl(deploy, site.name, prNumber)
			await postStatus({
				fetchImpl,
				githubToken,
				repository,
				commitSha,
				context: site.statusContext,
				state,
				description,
				targetUrl,
			})
			settled.set(site.name, { state, description, targetUrl })
			log(`${site.label}: ${state} ${targetUrl}`)
			if (state === 'failure') failures.push(`${site.label}: ${description}`)
		}
		if (settled.size === sites.length || now() >= deadline) break
		await sleep(pollMs)
	}

	for (const site of sites) {
		if (settled.has(site.name)) continue
		const description = `${site.label} preview did not finish before the timeout`
		await postStatus({
			fetchImpl,
			githubToken,
			repository,
			commitSha,
			context: site.statusContext,
			state: 'failure',
			description,
			targetUrl: previewUrl(site.name, prNumber),
		})
		failures.push(description)
	}

	return { ok: failures.length === 0, failures }
}

export async function deletePullRequestPreviews({
	token,
	prNumber,
	fetchImpl = fetch,
	sites = NETLIFY_SITES,
	log = console.log,
}) {
	requireToken(token)
	const failures = []

	for (const site of sites) {
		const deploys = await listDeploys(fetchImpl, token, site.name)
		const targets = deploysForPullRequest(deploys, prNumber)
		if (targets.length === 0) {
			log(`${site.label}: no deploy preview for pull request ${prNumber}`)
			continue
		}
		for (const deploy of targets) {
			try {
				if (deploy.locked) {
					await netlifyFetch(fetchImpl, token, `/deploys/${deploy.id}/unlock`, 'POST')
				}
				await netlifyFetch(fetchImpl, token, `/deploys/${deploy.id}`, 'DELETE')
				log(`${site.label}: deleted deploy ${deploy.id}`)
			} catch (error) {
				if (error.status === 404) {
					log(`${site.label}: deploy ${deploy.id} already gone`)
					continue
				}
				failures.push(`${site.label} deploy ${deploy.id}: ${error.message}`)
			}
		}
	}

	return { ok: failures.length === 0, failures }
}

function deployUrls(deploy) {
	if (!deploy) return []
	return [deploy.ssl_url, deploy.url, deploy.deploy_ssl_url, deploy.deploy_url].filter(Boolean)
}

function requireToken(token) {
	if (token) return
	throw new Error(
		'NETLIFY_AUTH_TOKEN is not set. Add a Netlify personal access token as the NETLIFY_AUTH_TOKEN Actions secret so preview checks and cleanup can call the Netlify API.',
	)
}

async function listDeploys(fetchImpl, token, siteName) {
	const deploys = []
	for (let page = 1; page <= 5; page++) {
		const batch = await netlifyFetch(fetchImpl, token, `/sites/${siteName}/deploys?per_page=100&page=${page}`, 'GET')
		if (!Array.isArray(batch) || batch.length === 0) break
		deploys.push(...batch)
		if (batch.length < 100) break
	}
	return deploys
}

async function netlifyFetch(fetchImpl, token, pathname, method) {
	const response = await fetchImpl(`${NETLIFY_API}${pathname}`, {
		method,
		headers: { Authorization: `Bearer ${token}` },
	})
	if (response.status === 204) return null
	const text = await response.text()
	if (!response.ok) {
		const error = new Error(`Netlify ${method} ${pathname} failed (${response.status}): ${text.slice(0, 300)}`)
		error.status = response.status
		throw error
	}
	return text ? JSON.parse(text) : null
}

async function postStatus({ fetchImpl, githubToken, repository, commitSha, context, state, description, targetUrl }) {
	const response = await fetchImpl(`${GITHUB_API}/repos/${repository}/statuses/${commitSha}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${githubToken}`,
			Accept: 'application/vnd.github+json',
			'Content-Type': 'application/json',
			'X-GitHub-Api-Version': '2022-11-28',
		},
		body: JSON.stringify({
			state,
			context,
			description: truncate(description, 140),
			target_url: targetUrl,
		}),
	})
	if (!response.ok) {
		const text = await response.text()
		throw new Error(`GitHub status ${context} failed (${response.status}): ${text.slice(0, 300)}`)
	}
}

function truncate(value, max) {
	if (value.length <= max) return value
	return `${value.slice(0, max - 1)}…`
}

function defaultSleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}
