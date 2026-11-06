import { complete } from './llm.js'
import { buildSystemPrompt } from './prompt.js'

export async function generateAgentResponse({ firstName, recentMoods, messages }) {
	return complete([
		{
			role: 'system',
			content: buildSystemPrompt({ firstName, recentMoods }),
		},
		...messages,
	])
}
