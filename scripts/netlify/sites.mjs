/** Netlify sites built from this repo. One site per prompt shell. */
export const NETLIFY_SITES = [
	{
		name: 'fullstack-promptable-app-example',
		label: 'side',
		statusContext: 'netlify/side',
	},
	{
		name: 'fullstack-promptable-prompt-first',
		label: 'prompt-first',
		statusContext: 'netlify/prompt-first',
	},
	{
		name: 'fullstack-promptable-agentic',
		label: 'agentic',
		statusContext: 'netlify/agentic',
	},
]

export function previewUrl(siteName, prNumber) {
	return `https://deploy-preview-${prNumber}--${siteName}.netlify.app`
}
