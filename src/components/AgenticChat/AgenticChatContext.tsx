import { createChatClientOptions } from '@tanstack/ai-client'
import type { UIMessage } from '@tanstack/ai-react'
import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { BrowserContext } from '../../types'
import { captureAgenticBrowserContext } from '../../utils/browserContext'

export interface AgenticChatContextValue {
	messages: UIMessage[]
	isLoading: boolean
	error: Error | null
	input: string
	setInput: (value: string) => void
	sendMessage: (text: string) => void
	handleSubmit: () => void
	handleKeyDown: (e: React.KeyboardEvent) => void
	stop: () => void
	clear: () => void
}

const AgenticChatContext = createContext<AgenticChatContextValue | null>(null)

export function useAgenticChat(): AgenticChatContextValue {
	const ctx = useContext(AgenticChatContext)
	if (!ctx) {
		throw new Error('useAgenticChat must be used within AgenticChatProvider')
	}
	return ctx
}

/**
 * Chat state for the fully agentic shell: no navigate/invalidateRouter
 * client tools and a location-free browser context. There is one route,
 * so the agent works from tool schemas, not a navigation manifest.
 */
export function AgenticChatProvider({ children }: { children: ReactNode }) {
	const [input, setInput] = useState('')

	const browserContextRef = useRef<BrowserContext | null>(null)

	const connection = useMemo(
		() =>
			fetchServerSentEvents('/api/chat', () => ({
				body: {
					browserContext: browserContextRef.current ?? captureAgenticBrowserContext(),
				},
			})),
		[],
	)

	const chatOptions = createChatClientOptions({ connection })

	const { messages, sendMessage, isLoading, error, clear, stop } = useChat(chatOptions)

	const handleSubmit = useCallback(() => {
		if (!input.trim() || isLoading) return
		browserContextRef.current = captureAgenticBrowserContext()
		void sendMessage(input).finally(() => {
			browserContextRef.current = null
		})
		setInput('')
	}, [input, isLoading, sendMessage])

	const sendPrompt = useCallback(
		(text: string) => {
			if (!text.trim() || isLoading) return
			browserContextRef.current = captureAgenticBrowserContext()
			void sendMessage(text).finally(() => {
				browserContextRef.current = null
			})
		},
		[isLoading, sendMessage],
	)

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault()
				handleSubmit()
			}
		},
		[handleSubmit],
	)

	const value = useMemo<AgenticChatContextValue>(
		() => ({
			messages,
			isLoading,
			error: error ?? null,
			input,
			setInput,
			sendMessage: sendPrompt,
			handleSubmit,
			handleKeyDown,
			stop,
			clear,
		}),
		[messages, isLoading, error, input, sendPrompt, handleSubmit, handleKeyDown, stop, clear],
	)

	return <AgenticChatContext.Provider value={value}>{children}</AgenticChatContext.Provider>
}
