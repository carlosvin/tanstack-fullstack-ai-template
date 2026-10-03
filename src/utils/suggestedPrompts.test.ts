import { describe, expect, it } from 'vitest'
import { parseSuggestedPrompts, suggestedPrompts } from './suggestedPrompts'

describe('parseSuggestedPrompts', () => {
	it('reads quoted bullets from the Suggested prompts section', () => {
		const md = `# Help

## Suggested prompts

- "First prompt"
- "Second prompt"

## Other
`
		expect(parseSuggestedPrompts(md)).toEqual(['First prompt', 'Second prompt'])
	})

	it('loads prompts from docs/help.md', () => {
		expect(suggestedPrompts.length).toBeGreaterThanOrEqual(3)
	})
})
