import helpMarkdown from '../../docs/help.md?raw'

/** Parse bullet lines under `## Suggested prompts` in docs/help.md. */
export function parseSuggestedPrompts(markdown: string): string[] {
	const section = markdown.match(/## Suggested prompts\s*\n([\s\S]*?)(?=\n## |\s*$)/)?.[1] ?? ''
	const prompts: string[] = []
	for (const line of section.split('\n')) {
		const trimmed = line.trim()
		if (!trimmed.startsWith('-')) continue
		const quoted = trimmed.match(/^-\s+"([^"]+)"\s*$/)
		if (quoted) {
			prompts.push(quoted[1])
			continue
		}
		const plain = trimmed.match(/^-\s+(.+)\s*$/)
		if (plain) prompts.push(plain[1])
	}
	return prompts
}

export const suggestedPrompts = parseSuggestedPrompts(helpMarkdown)
